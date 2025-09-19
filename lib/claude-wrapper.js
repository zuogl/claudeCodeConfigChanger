#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 解析配置文件
function parseConfig(content) {
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

// 加载配置并更新环境变量
function loadConfig() {
    const configPath = process.env.CLAUDE_CONFIG_PATH || path.join(os.homedir(), '.bashrc');

    try {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = parseConfig(content);

        if (config.baseUrl) {
            process.env.ANTHROPIC_BASE_URL = config.baseUrl;
        }
        if (config.authToken) {
            process.env.ANTHROPIC_AUTH_TOKEN = config.authToken;
        }

        return config;
    } catch (err) {
        console.error('加载配置文件失败:', err.message);
        return { baseUrl: null, authToken: null };
    }
}

// 初始加载配置
let currentConfig = loadConfig();

// 获取 claude 命令参数
const args = process.argv.slice(2);

// 启动 claude 进程
const claudeProcess = spawn('claude', args, {
    stdio: 'inherit',
    env: process.env
});

// 监听 SIGUSR2 信号来重新加载配置
process.on('SIGUSR2', () => {
    const newConfig = loadConfig();

    if (newConfig.baseUrl !== currentConfig.baseUrl ||
        newConfig.authToken !== currentConfig.authToken) {

        currentConfig = newConfig;

        console.log('\n🔄 配置已热重载');
        console.log(`   Base URL: ${newConfig.baseUrl || '默认'}`);
        console.log(`   Auth Token: ${newConfig.authToken ? '已设置' : '未设置'}`);
        console.log('');

        // 由于 claude 已经启动，环境变量更新只对新的子进程有效
        // 这里我们需要重启 claude 进程
        if (claudeProcess && !claudeProcess.killed) {
            console.log('⏳ 正在重启 Claude 进程以应用新配置...\n');

            // 保存当前进程状态
            const restartClaude = () => {
                // 启动新的 claude 进程
                const newClaudeProcess = spawn('claude', args, {
                    stdio: 'inherit',
                    env: process.env
                });

                // 更新进程引用
                Object.assign(claudeProcess, newClaudeProcess);

                newClaudeProcess.on('exit', (code) => {
                    process.exit(code);
                });
            };

            // 终止当前进程
            claudeProcess.kill('SIGTERM');

            // 等待进程结束后重启
            setTimeout(restartClaude, 500);
        }
    }
});

// 监听配置文件变化（备用方案）
if (process.env.CLAUDE_HOT_RELOAD === 'true') {
    const configPath = process.env.CLAUDE_CONFIG_PATH || path.join(os.homedir(), '.bashrc');
    let lastMtime = null;

    setInterval(() => {
        try {
            const stats = fs.statSync(configPath);
            if (!lastMtime || stats.mtime > lastMtime) {
                lastMtime = stats.mtime;
                process.emit('SIGUSR2');
            }
        } catch (err) {
            // 忽略错误
        }
    }, 1000);
}

// 处理进程退出
claudeProcess.on('exit', (code) => {
    process.exit(code);
});

// 处理中断信号
process.on('SIGINT', () => {
    claudeProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    claudeProcess.kill('SIGTERM');
});