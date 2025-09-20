# Claude Config Changer (ccc)

一个简单易用的命令行工具，用于轻松切换 Claude API 配置，支持当前 Shell 即时生效。

## 🌟 主要功能

- **快速切换配置**：在多个 Claude API 配置之间一键切换
- **即时生效**：配置更改后无需重启终端，立即在当前 Shell 生效
- **交互式界面**：友好的命令行菜单，操作简单直观
- **热重载支持**：Claude Code 运行时自动检测配置变化
- **多平台支持**：支持 Windows、macOS、Linux
- **多 Shell 兼容**：支持 bash、zsh、fish、PowerShell 等

## 📦 安装

### Windows 用户

#### 方法一：使用 PowerShell（推荐）

1. 打开 PowerShell（管理员权限）

2. 安装包：
```powershell
npm install -g claude-config-changer
```

3. 创建 PowerShell 配置文件（如果不存在）：
```powershell
if (!(Test-Path $PROFILE)) {
    New-Item -Type File -Path $PROFILE -Force
}
```

4. 在 PowerShell 配置文件末尾添加包装器（$PROFILE 的位置通常是：
   - Windows PowerShell: `%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
   - PowerShell 7+: `%USERPROFILE%\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`）：
```powershell
# Claude Config Changer - PowerShell wrapper
$global:ccc = {
    param($args)
    & npm root -g | ForEach-Object {
        if (Test-Path "$_\claude-config-changer\bin\ccc.js") {
            node "$_\claude-config-changer\bin\ccc.js" $args
            # Reload profile to apply changes
            . $PROFILE
        }
    }
}

$global:clc = {
    param($args)
    & npm root -g | ForEach-Object {
        if (Test-Path "$_\claude-config-changer\bin\clc.js") {
            node "$_\claude-config-changer\bin\clc.js" $args
        }
    }
}

# Create aliases
Set-Alias -Name ccc -Value $global:ccc -Scope Global
Set-Alias -Name clc -Value $global:clc -Scope Global
```

5. 重新加载 PowerShell 或运行：
```powershell
. $PROFILE
```

#### 方法二：使用 Git Bash

1. 安装 Git for Windows

2. 在 Git Bash 中运行：
```bash
npm install -g claude-config-changer

# 添加到 .bashrc（在用户主目录下）
echo '# Claude Config Changer - shell wrapper
if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
    source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
fi' >> ~/.bashrc

# 重新加载
source ~/.bashrc
```

### macOS/Linux 用户

#### 方法一：使用安装脚本（推荐）

```bash
git clone https://github.com/zuogl/claudeCodeConfigChanger.git
cd claudeCodeConfigChanger
./install.sh
```

#### 方法二：手动安装

1. 从 npm 安装：
```bash
npm install -g claude-config-changer
```

2. 添加 Shell 包装器到你的 Shell 配置文件：

**对于 bash (~/.bashrc)**:
```bash
# Claude Config Changer - shell wrapper
if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
    source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
fi
```

**对于 zsh (~/.zshrc)**:
```bash
# Claude Config Changer - shell wrapper
if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
    source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
fi
```

**对于 fish (~/.config/fish/config.fish)**:
```fish
# Claude Config Changer - fish wrapper
set -x NPM_ROOT (npm root -g)
if test -f "$NPM_ROOT/claude-config-changer/shell-wrapper.sh"
    bass source "$NPM_ROOT/claude-config-changer/shell-wrapper.sh"
end
```

3. 重启终端或运行：
```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

## 🔧 配置文件设置

### Windows PowerShell

在你的 PowerShell 配置文件（`$PROFILE`）中添加配置：

```powershell
# 第一个配置名称
# $env:ANTHROPIC_BASE_URL="https://api.example1.com"
# $env:ANTHROPIC_AUTH_TOKEN="your-token-1"

# 第二个配置名称
# $env:ANTHROPIC_BASE_URL="https://api.example2.com"
# $env:ANTHROPIC_AUTH_TOKEN="your-token-2"

# 官方API
# $env:ANTHROPIC_BASE_URL="https://api.anthropic.com"
# $env:ANTHROPIC_AUTH_TOKEN="sk-ant-api03-xxx"
```

### Windows Git Bash / Linux / macOS

在你的 Shell 配置文件（如 `~/.bashrc`、`~/.zshrc`）中添加配置：

```bash
# 第一个配置名称
# export ANTHROPIC_BASE_URL="https://api.example1.com"
# export ANTHROPIC_AUTH_TOKEN="your-token-1"

# 第二个配置名称
# export ANTHROPIC_BASE_URL="https://api.example2.com"
# export ANTHROPIC_AUTH_TOKEN="your-token-2"

# 官方API
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-xxx"
```

**重要提示**：
- 所有配置都需要用 `#` 注释掉，工具会自动取消注释当前使用的配置
- 每个配置组必须以 `# 配置名` 开头
- PowerShell 使用 `$env:VAR_NAME` 语法，而 bash/zsh 使用 `export VAR_NAME` 语法

## 🚀 使用方法

### 切换配置

```bash
# 打开交互式菜单选择配置
ccc

# 或者指定配置文件路径
ccc -p ~/.my-config
```

### 启动 Claude Code（支持热重载）

```bash
# 启动 Claude Code，配置变化时会自动提示
clc

# 传递参数给 Claude Code
clc --help
```

## 📋 命令选项

### ccc 命令

- `-h, --help`：显示帮助信息
- `-p, --path <path>`：指定配置文件路径
- `-v, --version`：显示版本号

### clc 命令

`clc` 会将所有参数直接传递给 Claude Code，同时添加热重载功能。

## 💡 工作原理

### 跨平台实现

#### Linux / macOS / Git Bash
- 使用 shell 函数包装器 (`ccc()` 和 `clc()`)
- 配置更改后自动 `source` 配置文件
- 环境变量立即在当前会话生效

#### Windows PowerShell
- 使用 PowerShell 函数包装器
- 配置更改后自动重新加载 `$PROFILE`
- 使用 `$env:` 语法管理环境变量

### 核心机制

1. **配置切换**：通过注释/取消注释环境变量来切换不同的 API 配置
2. **即时生效**：使用 Shell/PowerShell 包装器，配置更改后自动重新加载
3. **热重载**：监控配置文件变化，Claude Code 运行时自动提示更新
4. **平台检测**：自动识别操作系统并使用相应的配置文件路径

## 🛠️ 开发

```bash
# 克隆项目
git clone https://github.com/your-username/ccConfig.git
cd ccConfig

# 安装依赖
npm install

# 运行测试
npm test

# 链接全局使用
npm link
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.claude.com)
- [Node.js 官网](https://nodejs.org/)

---

**提示**：首次使用前，请确保已正确配置 Shell 配置文件中的 Claude API 信息。
