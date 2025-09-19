#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { ConfigWatcher, IPCService, findClaudeCodeProcesses } = require('../lib/config-watcher');

class ClaudeConfigDaemon {
    constructor(configPath) {
        this.configPath = configPath || path.join(os.homedir(), '.bashrc');
        this.watcher = null;
        this.ipcService = null;
        this.running = false;
        this.pidFile = path.join(os.tmpdir(), 'claude-config-daemon.pid');
    }

    async start() {
        if (this.running) return;

        // 检查是否已有守护进程在运行
        if (await this.isDaemonRunning()) {
            console.log('🔄 Claude Code 配置守护进程已在运行');
            return;
        }

        this.running = true;

        // 写入 PID 文件
        fs.writeFileSync(this.pidFile, process.pid.toString());

        // 启动 IPC 服务
        this.ipcService = new IPCService();
        await this.ipcService.start();
        console.log(`🔌 IPC 服务已启动: ${this.ipcService.socketPath}`);

        // 启动文件监控
        this.watcher = new ConfigWatcher(this.configPath);
        this.watcher.on('change', async () => {
            console.log('📁 检测到配置文件变化，通知 Claude Code 进程...');
            await this.notifyClaudeProcesses();
        });
        await this.watcher.start();

        console.log(`👀 开始监控配置文件: ${this.configPath}`);
        console.log('💡 按 Ctrl+C 退出守护进程\n');

        // 处理退出信号
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    async stop() {
        if (!this.running) return;

        this.running = false;

        console.log('\n🛑 正在停止守护进程...');

        if (this.watcher) {
            await this.watcher.stop();
        }

        if (this.ipcService) {
            await this.ipcService.stop();
        }

        // 删除 PID 文件
        try {
            fs.unlinkSync(this.pidFile);
        } catch (err) {
            // 忽略错误
        }

        console.log('✅ 守护进程已停止');
        process.exit(0);
    }

    async isDaemonRunning() {
        try {
            if (fs.existsSync(this.pidFile)) {
                const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
                // 检查进程是否存在
                process.kill(pid, 0);
                return true;
            }
        } catch (err) {
            // 进程不存在
        }
        return false;
    }

    async notifyClaudeProcesses() {
        const processes = await findClaudeCodeProcesses();
        let notified = 0;

        for (const proc of processes) {
            try {
                const socketPath = path.join(os.tmpdir(), `claude-config-${proc.pid}.sock`);

                // 检查 socket 是否存在
                try {
                    await fs.promises.access(socketPath);
                } catch (err) {
                    continue;
                }

                // 使用子进程发送信号，通知 Claude Code 重新加载配置
                process.kill(proc.pid, 'SIGUSR1');
                notified++;

                console.log(`   📡 已通知进程 ${proc.pid}`);
            } catch (err) {
                // 忽略无法通知的进程
            }
        }

        if (notified === 0) {
            console.log('   ⚠️  没有找到正在运行的 Claude Code 进程');
        }
    }

    getStatus() {
        return {
            running: this.running,
            configPath: this.configPath,
            watching: this.watcher?.watching || false,
            ipcRunning: this.ipcService?.server?.listening || false,
            pidFile: this.pidFile
        };
    }
}

// 命令行处理
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Claude Code 配置守护进程

使用方法:
  claude-config-daemon start    启动守护进程
  claude-config-daemon stop     停止守护进程
  claude-config-daemon status   查看状态
  claude-config-daemon --help   显示帮助

示例:
  # 启动守护进程
  claude-config-daemon start

  # 在另一个终端使用 ccc 切换配置
  ccc

  # Claude Code 会自动收到配置更新通知
        `);
        return;
    }

    const daemon = new ClaudeConfigDaemon();

    if (args[0] === 'stop') {
        if (await daemon.isDaemonRunning()) {
            const pid = parseInt(fs.readFileSync(daemon.pidFile, 'utf8'));
            process.kill(pid, 'SIGTERM');
            console.log('✅ 守护进程停止命令已发送');
        } else {
            console.log('⚠️  守护进程未运行');
        }
        return;
    }

    if (args[0] === 'status') {
        if (await daemon.isDaemonRunning()) {
            console.log('✅ 守护进程正在运行');
            const pid = parseInt(fs.readFileSync(daemon.pidFile, 'utf8'));
            console.log(`   PID: ${pid}`);
        } else {
            console.log('❌ 守护进程未运行');
        }
        return;
    }

    // 默认启动
    await daemon.start();
}

if (require.main === module) {
    main().catch(err => {
        console.error('❌ 守护进程启动失败:', err.message);
        process.exit(1);
    });
}

module.exports = { ClaudeConfigDaemon };