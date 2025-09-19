const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { ConfigWatcher, IPCService } = require('./config-watcher');

class ClaudeConfigHotReload {
    constructor(configPath) {
        this.configPath = configPath || path.join(os.homedir(), '.bashrc');
        this.watcher = null;
        this.ipcService = null;
        this.configCache = null;
        this.lastLoadTime = 0;
        this.onConfigChange = null;
        this.started = false;
    }

    async start() {
        if (this.started) return;

        this.started = true;

        // 启动 IPC 服务
        this.ipcService = new IPCService();
        await this.ipcService.start();
        console.log(`🔌 IPC 服务已启动: ${this.ipcService.socketPath}`);

        // 监听配置变化事件
        this.ipcService.on('configChanged', (data) => {
            console.log('🔄 收到配置变化通知，正在重新加载...');
            this.reloadConfig();
        });

        // 启动文件监控
        this.watcher = new ConfigWatcher(this.configPath);
        this.watcher.on('change', () => {
            console.log('📁 检测到配置文件变化');
            this.reloadConfig();
        });
        await this.watcher.start();

        // 初始加载配置
        await this.loadConfig();
    }

    async stop() {
        if (!this.started) return;

        this.started = false;

        if (this.watcher) {
            await this.watcher.stop();
        }

        if (this.ipcService) {
            await this.ipcService.stop();
        }
    }

    async loadConfig() {
        try {
            const content = await fs.readFile(this.configPath, 'utf8');
            const lines = content.split('\n');
            const config = this.parseClaudeConfig(lines);

            this.configCache = config;
            this.lastLoadTime = Date.now();

            if (this.onConfigChange) {
                this.onConfigChange(config);
            }

            return config;
        } catch (err) {
            console.error('❌ 加载配置失败:', err.message);
            return this.configCache || { baseUrl: null, authToken: null };
        }
    }

    async reloadConfig() {
        const newConfig = await this.loadConfig();

        if (newConfig && process.env.ANTHROPIC_AUTH_TOKEN !== newConfig.authToken) {
            // 更新环境变量
            if (newConfig.baseUrl) {
                process.env.ANTHROPIC_BASE_URL = newConfig.baseUrl;
                console.log('✅ 已更新 ANTHROPIC_BASE_URL');
            }

            if (newConfig.authToken) {
                process.env.ANTHROPIC_AUTH_TOKEN = newConfig.authToken;
                console.log('✅ 已更新 ANTHROPIC_AUTH_TOKEN');
            }

            // 通知应用配置已更新
            if (global.claudeCode && global.claudeCode.onConfigUpdate) {
                global.claudeCode.onConfigUpdate(newConfig);
            }
        }
    }

    parseClaudeConfig(lines) {
        let inActiveBlock = false;
        let baseUrl = null;
        let authToken = null;

        for (const line of lines) {
            // 检查是否是活跃的配置块
            if (line.includes('# [ACTIVE]')) {
                inActiveBlock = true;
            } else if (inActiveBlock && line.startsWith('#') && !line.includes('export')) {
                inActiveBlock = false;
            } else if (inActiveBlock && line.startsWith('export ')) {
                // 解析 ANTHROPIC_BASE_URL
                const baseUrlMatch = line.match(/export\s+ANTHROPIC_BASE_URL="([^"]*)"/);
                if (baseUrlMatch) {
                    baseUrl = baseUrlMatch[1];
                }

                // 解析 ANTHROPIC_AUTH_TOKEN
                const tokenMatch = line.match(/export\s+ANTHROPIC_AUTH_TOKEN="([^"]*)"/);
                if (tokenMatch) {
                    authToken = tokenMatch[1];
                }
            }
        }

        return { baseUrl, authToken };
    }

    getConfig() {
        return this.configCache;
    }

    getStats() {
        return {
            configPath: this.configPath,
            lastLoadTime: this.lastLoadTime,
            watching: this.watcher?.watching || false,
            ipcRunning: this.ipcService?.server?.listening || false,
            configCache: this.configCache
        };
    }
}

// 创建全局单例
let globalHotReload = null;

// 初始化函数
async function initClaudeConfigHotReload(configPath) {
    if (globalHotReload) {
        return globalHotReload;
    }

    globalHotReload = new ClaudeConfigHotReload(configPath);
    await globalHotReload.start();

    // 设置优雅退出
    const exitHandler = async () => {
        if (globalHotReload) {
            await globalHotReload.stop();
        }
        process.exit(0);
    };

    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
    process.on('exit', exitHandler);

    return globalHotReload;
}

// 如果直接运行此脚本，启动监控服务
if (require.main === module) {
    (async () => {
        console.log('🚀 启动 Claude Code 配置热重载服务...');

        const hotReload = await initClaudeConfigHotReload();

        console.log('📊 配置热重载服务已启动');
        console.log('监控文件:', hotReload.configPath);
        console.log('IPC 地址:', hotReload.ipcService.socketPath);
        console.log('\n按 Ctrl+C 退出...\n');

        // 定期显示状态
        setInterval(() => {
            const stats = hotReload.getStats();
            console.log(`[${new Date().toLocaleTimeString()}] 配置已加载: ${stats.configCache.authToken ? '✅' : '❌'}`);
        }, 30000);
    })();
}

module.exports = {
    ClaudeConfigHotReload,
    initClaudeConfigHotReload
};