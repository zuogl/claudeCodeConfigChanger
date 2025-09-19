const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { IPCService } = require('./config-watcher');

// 创建配置注入器，用于在 Claude Code 运行时监控配置变化
class ClaudeConfigInjector {
    constructor() {
        this.configPath = path.join(os.homedir(), '.bashrc');
        this.ipcService = null;
        this.injected = false;
        this.originalEnv = {
            ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
            ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN
        };
    }

    async start() {
        // 启动 IPC 服务
        this.ipcService = new IPCService();
        await this.ipcService.start();

        // 监听配置变化
        this.ipcService.on('configChanged', async () => {
            await this.reloadConfig();
        });

        // 注入到全局 process
        this.injectToProcess();
    }

    injectToProcess() {
        if (this.injected) return;

        // 保存原始的 process.env
        const originalEnv = process.env;
        const originalEnvDescriptor = Object.getOwnPropertyDescriptor(process, 'env');

        // 创建一个新的 Proxy 来拦截 process.env 的访问
        const envProxy = new Proxy(originalEnv, {
            get: (target, prop) => {
                // 如果配置已加载且请求的是 Claude 相关的环境变量
                if (this.currentConfig) {
                    if (prop === 'ANTHROPIC_BASE_URL' && this.currentConfig.baseUrl) {
                        return this.currentConfig.baseUrl;
                    }
                    if (prop === 'ANTHROPIC_AUTH_TOKEN' && this.currentConfig.authToken) {
                        return this.currentConfig.authToken;
                    }
                }
                // 否则返回原始值
                return target[prop];
            },
            set: (target, prop, value) => {
                target[prop] = value;
                return true;
            }
        });

        // 替换 process.env
        Object.defineProperty(process, 'env', {
            configurable: true,
            enumerable: true,
            get: () => envProxy,
            set: (value) => {
                // 如果需要整体替换 process.env
                if (originalEnvDescriptor && originalEnvDescriptor.set) {
                    originalEnvDescriptor.set.call(process, value);
                } else {
                    // 直接赋值
                    process.env = value;
                }
            }
        });

        this.injected = true;
    }

    async reloadConfig() {
        try {
            const content = await fs.promises.readFile(this.configPath, 'utf8');
            const config = this.parseConfig(content);

            if (config.authToken !== this.currentConfig?.authToken ||
                config.baseUrl !== this.currentConfig?.baseUrl) {

                this.currentConfig = config;
                console.log('\n🔄 Claude Code 配置已更新');
                console.log(`   Base URL: ${config.baseUrl || '默认'}`);
                console.log(`   Auth Token: ${config.authToken ? '已设置' : '未设置'}`);

                // 更新当前进程的环境变量
                if (config.baseUrl) {
                    process.env.ANTHROPIC_BASE_URL = config.baseUrl;
                }
                if (config.authToken) {
                    process.env.ANTHROPIC_AUTH_TOKEN = config.authToken;
                }

                // 触发全局事件，通知 Claude Code 重新加载配置
                if (global.emit) {
                    global.emit('claude:config:updated', config);
                }
            }
        } catch (err) {
            console.error('重新加载配置失败:', err.message);
        }
    }

    parseConfig(content) {
        const lines = content.split('\n');
        let inActiveBlock = false;
        let baseUrl = null;
        let authToken = null;

        for (const line of lines) {
            if (line.includes('# [ACTIVE]')) {
                inActiveBlock = true;
            } else if (inActiveBlock && line.startsWith('#') && !line.includes('export')) {
                inActiveBlock = false;
            } else if (inActiveBlock && line.startsWith('export ')) {
                const baseUrlMatch = line.match(/export\s+ANTHROPIC_BASE_URL="([^"]*)"/);
                const tokenMatch = line.match(/export\s+ANTHROPIC_AUTH_TOKEN="([^"]*)"/);

                if (baseUrlMatch) baseUrl = baseUrlMatch[1];
                if (tokenMatch) authToken = tokenMatch[1];
            }
        }

        return { baseUrl, authToken };
    }

    async stop() {
        if (this.ipcService) {
            await this.ipcService.stop();
        }
    }
}

// 创建包装函数，用于启动 Claude Code
async function createClaudeWrapper() {
    const injector = new ClaudeConfigInjector();
    await injector.start();

    // 初始加载配置
    await injector.reloadConfig();

    // 返回一个函数，用于启动实际的 Claude Code
    return async function runClaudeWithHotReload(args = []) {
        console.log('🚀 启动 Claude Code（支持配置热重载）...\n');

        // 过滤掉 'claude' 本身，只保留真正的参数
        const claudeArgs = args.filter(arg => arg !== 'claude');

        // 创建一个包装脚本来运行 claude
        const wrapperScript = path.join(__dirname, 'claude-wrapper.js');

        // 使用 node 运行包装脚本，而不是直接运行 claude
        const claudeProcess = spawn('node', [wrapperScript, ...claudeArgs], {
            stdio: 'inherit',
            env: {
                ...process.env,
                CLAUDE_CONFIG_PATH: injector.configPath,
                CLAUDE_HOT_RELOAD: 'true'
            }
        });

        // 监听配置变化，向子进程发送信号
        injector.ipcService.on('configChanged', async () => {
            await injector.reloadConfig();
            // 发送 SIGUSR2 信号通知子进程重新加载配置
            if (claudeProcess.pid) {
                try {
                    process.kill(claudeProcess.pid, 'SIGUSR2');
                } catch (err) {
                    // 进程可能已经退出
                }
            }
        });

        claudeProcess.on('exit', async (code) => {
            await injector.stop();
            process.exit(code);
        });

        return claudeProcess;
    };
}

module.exports = {
    ClaudeConfigInjector,
    createClaudeWrapper
};