# Claude Config Changer

轻松切换 Claude API 配置的命令行工具，支持在当前 shell 中即时刷新环境变量。

## 功能特点

- 🔄 在多个 Claude API 配置之间快速切换
- ✅ **当前 shell 即时生效（无需新开终端）**
- 🎯 交互式选择界面
- 📝 自动注释/取消注释环境变量
- 🐚 支持多种 shell (bash, zsh, fish)
- 🛡️ 安全地处理敏感信息

## 安装

### 方法一：使用安装脚本（推荐）

```bash
git clone https://github.com/yourusername/ccConfig.git
cd ccConfig
./install.sh
```

安装脚本会：
1. 全局安装 npm 包
2. 设置 shell 函数包装器
3. 自动配置你的 shell 环境

### 方法二：手动安装

1. 全局安装包：
```bash
npm install -g .
```

2. 在你的 shell 配置文件（~/.bashrc 或 ~/.zshrc）中添加：
```bash
# Claude Config Changer - shell wrapper
if [ -f "/path/to/ccConfig/shell-wrapper.sh" ]; then
    source "/path/to/ccConfig/shell-wrapper.sh"
fi
```

3. 重启终端或运行：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

## 使用方法

1. 在你的 shell 配置文件中（如 `~/.bashrc` 或 `~/.zshrc`）添加配置：

```bash
# 春秋中转
# export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"
# export ANTHROPIC_AUTH_TOKEN="xxx"

# 官方API
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-xxx"
```

2. 运行命令：

```bash
ccc
```

3. 使用方向键选择配置，按回车确认。**配置会在当前 shell 中立即生效！**

## 命令行选项

```bash
ccc --help              # 显示帮助信息
ccc --config <path>     # 指定自定义配置文件路径
```

## 工作原理

`ccc` 命令是一个 shell 函数，它会：
1. 运行实际的配置切换程序
2. 自动重新加载你的 shell 配置文件
3. 在当前 shell 中更新环境变量

这意味着你可以继续在同一个终端窗口工作，无需打开新窗口！

## 配置格式

每个配置组必须以 `# 配置名` 开头，后面跟着环境变量定义：

```bash
# 配置名称
# export ANTHROPIC_BASE_URL="https://..."
# export ANTHROPIC_AUTH_TOKEN="..."
```

## 许可证

MIT# claudeCodeConfigChanger
