# Claude Code 配置热重载功能

这个功能允许全局安装的 Claude Code 在不重启的情况下，动态重新加载配置信息。

## 问题场景

当你运行 Claude Code（全局 npm 包）时，它会在启动时读取配置信息（如 ANTHROPIC_AUTH_TOKEN）。如果配置信息发生变化（例如积分用完需要切换账号），通常需要：

1. 退出当前的 Claude Code 会话
2. 使用 ccc 切换配置
3. 重新启动 Claude Code

这会丢失当前的上下文和对话历史。

## 解决方案

提供了包装脚本方案：

### 包装脚本（推荐）

使用包装脚本启动 Claude Code，自动注入配置监控功能。

## 使用方法

### 使用包装脚本

```bash
# 使用包装脚本启动 Claude Code
clc [claude-code 参数]

# 例如：
clc
clc --help
```

特点：
- 自动注入配置监控
- 简单易用
- 适合单个 Claude Code 会话

## 工作原理

### 包装脚本模式
1. 启动时创建配置注入器
2. 重写 `process.env` 访问器
3. 通过 IPC 接收配置变更通知
4. 动态更新环境变量

## 示例工作流

### 包装脚本工作流
```bash
# 终端 1：启动 Claude Code
clc

# 终端 2：切换配置
ccc

# 选择新配置后，终端 1 自动更新
```

## 高级用法

### 自定义配置文件路径

```bash
# 包装脚本
export CLAUDE_CONFIG_PATH=~/.zshrc
clc
```

## 限制

1. 仅支持环境变量配置（ANTHROPIC_*）
2. 需要相同用户的进程间通信
3. Claude Code 必须支持信号处理
4. 某些深层配置可能需要重启

## 技术细节

- 配置监控服务：`lib/config-watcher.js`
- 配置注入器：`lib/claude-injector.js`
- 启动命令：`bin/clc.js`

## 故障排除

### 问题：配置没有自动更新
1. 确认配置文件路径正确
2. 检查守护进程是否运行
3. 查看 Claude Code 是否接收到信号

### 问题：权限错误
1. 确保有权限访问配置文件
2. 检查临时目录权限

### 问题：多个 Claude Code 进程
推荐使用守护进程模式，可以同时通知多个进程

## 测试

```bash
# 运行演示
npm run demo

# 测试热重载服务
npm run hot-reload
```
