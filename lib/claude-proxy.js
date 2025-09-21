#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 解析配置文件
function parseConfig(content, isPowerShell = false) {
    const lines = content.split('\n');
    let baseUrl = null;
    let authToken = null;

    // 查找未被注释的变量定义
    for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过注释行
        if (trimmedLine.startsWith('#')) continue;

        if (isPowerShell) {
            // PowerShell 语法: $env:VAR_NAME="value"
            if (trimmedLine.startsWith('$env:ANTHROPIC_BASE_URL=')) {
                const match = trimmedLine.match(/\$env:ANTHROPIC_BASE_URL=["']?([^"'\s]+)["']?/);
                if (match) baseUrl = match[1];
            }

            if (trimmedLine.startsWith('$env:ANTHROPIC_AUTH_TOKEN=')) {
                const match = trimmedLine.match(/\$env:ANTHROPIC_AUTH_TOKEN=["']?([^"'\s]+)["']?/);
                if (match) authToken = match[1];
            }
        } else {
            // Bash/Zsh 语法: export VAR_NAME="value"
            if (trimmedLine.startsWith('export ANTHROPIC_BASE_URL=')) {
                const match = trimmedLine.match(/export\s+ANTHROPIC_BASE_URL=["']?([^"'\s]+)["']?/);
                if (match) baseUrl = match[1];
            }

            if (trimmedLine.startsWith('export ANTHROPIC_AUTH_TOKEN=')) {
                const match = trimmedLine.match(/export\s+ANTHROPIC_AUTH_TOKEN=["']?([^"'\s]+)["']?/);
                if (match) authToken = match[1];
            }
        }
    }

    return { baseUrl, authToken };
}

// 获取配置文件路径
function getConfigPaths() {
    const home = os.homedir();
    const platform = process.platform;

    if (platform === 'win32') {
        // Windows 配置文件路径
        const windowsPaths = [
            // PowerShell profiles
            path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
            path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
            // Git Bash / WSL
            path.join(home, '.bashrc'),
            path.join(home, '.bash_profile'),
            path.join(home, '.zshrc')
        ];
        return windowsPaths;
    } else {
        // Unix-like systems
        return [
            path.join(home, '.zshrc'),
            path.join(home, '.bashrc'),
            path.join(home, '.bash_profile'),
            path.join(home, '.profile')
        ];
    }
}

// 动态加载配置
function loadConfig() {
    const configPaths = getConfigPaths();

    for (const configPath of configPaths) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const isPowerShell = configPath.endsWith('.ps1');
            const config = parseConfig(content, isPowerShell);
            if (config.baseUrl || config.authToken) {
                return { ...config, configPath, isPowerShell };
            }
        } catch (err) {
            // 忽略错误，继续尝试下一个文件
        }
    }

    return { baseUrl: null, authToken: null, configPath: null, isPowerShell: false };
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
        // 在Windows上需要使用不同的方式
        // 不要重复添加.cmd后缀
        const command = targetCommand;

        claudeProcess = spawn(command, args, {
            env: env,
            stdio: 'inherit',
            shell: process.platform === 'win32'
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
    const configPaths = getConfigPaths();

    // 获取有效的配置文件
    let activeConfigPath = currentConfig.configPath;
    let lastMtime = null;

    if (activeConfigPath) {
        try {
            const stats = fs.statSync(activeConfigPath);
            lastMtime = stats.mtime;
        } catch (err) {
            // 如果当前配置文件不存在，尝试找其他的
            activeConfigPath = null;
        }
    }

    // 如果没有有效的配置文件，尝试找到一个
    if (!activeConfigPath) {
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
                    console.log('   提示: 请使用ctrl(^) + c 结束本次对话，然后使用ccs开启新的对话\n');

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
    // 在Windows上尝试使用claude.exe或claude.cmd
    let claudeCommand = 'claude';
    if (process.platform === 'win32') {
        // 检查是否存在claude.cmd (通过npm安装的情况)
        const { execSync } = require('child_process');
        try {
            execSync('where claude.cmd', { stdio: 'ignore' });
            claudeCommand = 'claude.cmd';
        } catch {
            // 如果没有claude.cmd，尝试claude.exe或保持claude
            claudeCommand = 'claude';
        }
    }
    createProxy(claudeCommand, args);
}

main();