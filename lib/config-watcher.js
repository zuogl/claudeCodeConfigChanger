const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const os = require('os');

class ConfigWatcher extends EventEmitter {
    constructor(configPath) {
        super();
        this.configPath = configPath;
        this.watching = false;
        this.lastMtime = null;
        this.watchTimeout = null;
    }

    async start() {
        if (this.watching) return;

        this.watching = true;
        await this.checkConfig();

        // 设置轮询监听（跨平台兼容）
        setInterval(() => this.checkConfig(), 1000);
    }

    async stop() {
        this.watching = false;
        if (this.watchTimeout) {
            clearTimeout(this.watchTimeout);
            this.watchTimeout = null;
        }
    }

    async checkConfig() {
        try {
            const stats = await fs.stat(this.configPath);
            if (!this.lastMtime || stats.mtime > this.lastMtime) {
                this.lastMtime = stats.mtime;
                this.emit('change', this.configPath);
            }
        } catch (err) {
            // 文件不存在，继续监听
        }
    }
}

class IPCService {
    constructor() {
        this.socketPath = path.join(os.tmpdir(), `claude-config-${process.pid}.sock`);
        this.server = null;
        this.clients = new Set();
    }

    async start() {
        // 尝试删除已存在的 socket
        try {
            await fs.unlink(this.socketPath);
        } catch (err) {
            // 忽略文件不存在的错误
        }

        const net = require('net');

        this.server = net.createServer((socket) => {
            this.clients.add(socket);

            socket.on('data', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(socket, message);
                } catch (err) {
                    socket.write(JSON.stringify({ error: 'Invalid message format' }));
                }
            });

            socket.on('close', () => {
                this.clients.delete(socket);
            });

            socket.on('error', () => {
                this.clients.delete(socket);
            });
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.socketPath, resolve);
            this.server.on('error', reject);
        });
    }

    async stop() {
        if (this.server) {
            this.server.close();
            try {
                await fs.unlink(this.socketPath);
            } catch (err) {
                // 忽略错误
            }
        }
    }

    handleMessage(socket, message) {
        switch (message.type) {
            case 'ping':
                socket.write(JSON.stringify({ type: 'pong', pid: process.pid }));
                break;
            case 'config_changed':
                this.emit('configChanged', message.data);
                // 广播给所有客户端
                this.broadcast({ type: 'config_changed', data: message.data });
                break;
            default:
                socket.write(JSON.stringify({ error: 'Unknown message type' }));
        }
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            try {
                client.write(data);
            } catch (err) {
                this.clients.delete(client);
            }
        });
    }

    async sendCommand(command, data = {}) {
        const net = require('net');

        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.on('error', (err) => {
                reject(err);
            });

            socket.connect(this.socketPath, () => {
                socket.write(JSON.stringify({ ...command, data }));

                const timeout = setTimeout(() => {
                    socket.destroy();
                    reject(new Error('Command timeout'));
                }, 2000);

                socket.on('data', (response) => {
                    clearTimeout(timeout);
                    try {
                        resolve(JSON.parse(response.toString()));
                    } catch (err) {
                        reject(err);
                    }
                    socket.destroy();
                });
            });
        });
    }
}

// 创建 IPC 服务的继承
Object.setPrototypeOf(IPCService.prototype, EventEmitter.prototype);

// 找到所有运行中的 Claude Code 进程
async function findClaudeCodeProcesses() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    try {
        const { stdout } = await execAsync('ps aux | grep -v grep | grep claude-code');
        const lines = stdout.split('\n').filter(line => line.trim());

        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                pid: parseInt(parts[1]),
                command: parts.slice(10).join(' ')
            };
        });
    } catch (err) {
        return [];
    }
}

// 通知所有运行中的 Claude Code 进程
async function notifyClaudeCodeProcesses(configPath) {
    const processes = await findClaudeCodeProcesses();
    const notified = [];

    for (const proc of processes) {
        try {
            const socketPath = path.join(os.tmpdir(), `claude-config-${proc.pid}.sock`);

            // 检查 socket 是否存在
            try {
                await fs.access(socketPath);
            } catch (err) {
                continue;
            }

            const ipc = new IPCService();
            await ipc.sendCommand({ type: 'config_changed' }, { configPath });
            notified.push(proc.pid);
        } catch (err) {
            // 忽略无法连接的进程
        }
    }

    return notified;
}

module.exports = {
    ConfigWatcher,
    IPCService,
    findClaudeCodeProcesses,
    notifyClaudeCodeProcesses
};