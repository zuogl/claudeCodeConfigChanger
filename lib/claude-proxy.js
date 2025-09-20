#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 解析配置文件
function parseConfig(content) {
    const lines = content.split('\n');
    let baseUrl = null;
    let authToken = null;

    // 查找未被注释的 export 语句
    for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过注释行
        if (trimmedLine.startsWith('#')) continue;

        // 查找 ANTHROPIC_BASE_URL
        if (trimmedLine.startsWith('export ANTHROPIC_BASE_URL=')) {
            const match = trimmedLine.match(/export\s+ANTHROPIC_BASE_URL=["']?([^"'\s]+)["']?/);
            if (match) baseUrl = match[1];
        }

        // 查找 ANTHROPIC_AUTH_TOKEN
        if (trimmedLine.startsWith('export ANTHROPIC_AUTH_TOKEN=')) {
            const match = trimmedLine.match(/export\s+ANTHROPIC_AUTH_TOKEN=["']?([^"'\s]+)["']?/);
            if (match) authToken = match[1];
        }
    }

    return { baseUrl, authToken };
}

// 动态加载配置
function loadConfig() {
    // 优先使用 .zshrc，然后是 .bashrc
    const configPaths = [
        path.join(os.homedir(), '.zshrc'),
        path.join(os.homedir(), '.bashrc')
    ];

    for (const configPath of configPaths) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const config = parseConfig(content);
            if (config.baseUrl || config.authToken) {
                return config;
            }
        } catch (err) {
            // 忽略错误
        }
    }

    return { baseUrl: null, authToken: null };
}

// 拦截并转发输入输出
function createProxy(targetCommand, args) {
    let claudeProcess = null;
    let currentConfig = loadConfig();
    let isRestarting = false;

    // 启动 Claude 进程的函数
    function startClaude() {
        // 每次启动时都重新加载配置
        currentConfig = loadConfig();

        // 设置环境变量
        const env = { ...process.env };
        if (currentConfig.baseUrl) {
            env.ANTHROPIC_BASE_URL = currentConfig.baseUrl;
        }
        if (currentConfig.authToken) {
            env.ANTHROPIC_AUTH_TOKEN = currentConfig.authToken;
        }

        // 启动 claude
        claudeProcess = spawn(targetCommand, args, {
            env: env,
            stdio: 'inherit'
        });

        // 处理进程退出
        claudeProcess.on('exit', (code) => {
            if (!isRestarting) {
                process.exit(code);
            }
        });

        return claudeProcess;
    }

    // 初始启动
    startClaude();

    // 监控配置文件变化
    const configPaths = [
        path.join(os.homedir(), '.zshrc'),
        path.join(os.homedir(), '.bashrc')
    ];

    // 获取有效的配置文件
    let activeConfigPath = null;
    let lastMtime = null;

    for (const configPath of configPaths) {
        try {
            const stats = fs.statSync(configPath);
            activeConfigPath = configPath;
            lastMtime = stats.mtime;
            break;
        } catch (err) {
            // 忽略错误
        }
    }

    if (!activeConfigPath) {
        console.error('未找到配置文件');
        return;
    }

    const checkConfigInterval = setInterval(() => {
        try {
            const stats = fs.statSync(activeConfigPath);
            if (stats.mtime > lastMtime) {
                lastMtime = stats.mtime;

                const newConfig = loadConfig();

                // 检查配置是否真的改变了
                if (newConfig.baseUrl !== currentConfig.baseUrl ||
                    newConfig.authToken !== currentConfig.authToken) {

                    console.log('\n🔄 检测到配置变化，环境变量已更新:');
                    console.log(`   Base URL: ${newConfig.baseUrl || '默认'}`);
                    console.log(`   Auth Token: ${newConfig.authToken ? '已设置' : '未设置'}`);
                    console.log('   提示: 新的环境变量将在下次命令执行时生效\n');

                    currentConfig = newConfig;

                    // 更新当前进程的环境变量（供下次启动使用）
                    if (currentConfig.baseUrl) {
                        process.env.ANTHROPIC_BASE_URL = currentConfig.baseUrl;
                    }
                    if (currentConfig.authToken) {
                        process.env.ANTHROPIC_AUTH_TOKEN = currentConfig.authToken;
                    }
                }
            }
        } catch (err) {
            // 忽略错误
        }
    }, 1000);

    // 清理函数
    function cleanup() {
        clearInterval(checkConfigInterval);
        if (claudeProcess && !claudeProcess.killed) {
            claudeProcess.kill('SIGTERM');
        }
    }

    // 处理退出信号
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    createProxy('claude', args);
}

main();