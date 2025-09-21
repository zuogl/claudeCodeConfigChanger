# Claude 配置切换器 (CCC) 🚀

> 轻松管理多个 Claude API 配置，一键切换，无需重启！

## 📖 这是什么？

Claude 配置切换器是一个简单易用的工具，专门为使用 Claude Code 的用户设计。如果你：

- 使用多个 Claude API 服务（比如官方API、代理服务等）
- 经常需要在不同配置之间切换
- 厌倦了每次都要手动修改配置文件
- 希望切换后立即生效，不用重启终端

那么这个工具就是为你准备的！

## ✨ 主要功能

### 🎯 核心功能
- **一键切换配置** - 在多个 Claude API 配置间轻松切换
- **立即生效** - 无需重启终端或重新打开程序
- **图形化菜单** - 友好的选择界面，清楚显示当前使用的配置
- **自动检测变化** - Claude Code 运行时自动提示配置更新

### 🖥️ 平台支持
- ✅ Windows (PowerShell/命令提示符/Git Bash)
- ✅ macOS (终端)
- ✅ Linux (各种Shell)

### 🛡️ 安全特性
- 配置文件本地存储，不上传任何信息
- API密钥在菜单中自动打码显示
- 支持多种Shell环境

## 🚀 快速开始

### 第一步：检查前置条件

在开始之前，请确保你的电脑已安装：

1. **Node.js** (版本 14.0.0 或更高)
   - 访问 [nodejs.org](https://nodejs.org) 下载安装
   - 安装后在命令行输入 `node --version` 检查

2. **Claude CLI**
   - 确保已经安装并能正常使用 `claude` 命令

### 第二步：全局安装 (推荐)

打开终端或命令提示符，运行以下命令：

```bash
npm install -g claude-config-changer
```

安装完成后，你就可以在任何地方使用 `ccc` 和 `ccs` 命令了！

### 第三步：配置Shell环境

#### Windows PowerShell 用户

1. **创建PowerShell配置文件**（如果还没有）：
   ```powershell
   # 检查配置文件是否存在
   Test-Path $PROFILE

   # 如果返回 False，创建配置文件
   New-Item -Type File -Path $PROFILE -Force
   ```

2. **添加Shell包装器到配置文件**：
   ```powershell
   # 打开配置文件编辑
   notepad $PROFILE
   ```

   在文件末尾添加以下内容：
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

   $global:ccs = {
       param($args)
       & npm root -g | ForEach-Object {
           if (Test-Path "$_\claude-config-changer\bin\ccs.js") {
               node "$_\claude-config-changer\bin\ccs.js" $args
           }
       }
   }

   # Create aliases
   Set-Alias -Name ccc -Value $global:ccc -Scope Global
   Set-Alias -Name ccs -Value $global:ccs -Scope Global
   ```

3. **重新加载配置**：
   ```powershell
   . $PROFILE
   ```

#### macOS/Linux 用户

1. **确定你的Shell类型**：
   ```bash
   echo $SHELL
   ```

2. **编辑对应的配置文件**：
   ```bash
   # 对于 bash 用户
   nano ~/.bashrc

   # 对于 zsh 用户
   nano ~/.zshrc

   # 对于 fish 用户
   nano ~/.config/fish/config.fish
   ```

3. **添加Shell包装器**：

   **对于 bash/zsh 用户**，在配置文件末尾添加：
   ```bash
   # Claude Config Changer - shell wrapper
   if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
       source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
   fi
   ```

   **对于 fish 用户**，添加：
   ```fish
   # Claude Config Changer - fish wrapper
   set -x NPM_ROOT (npm root -g)
   if test -f "$NPM_ROOT/claude-config-changer/shell-wrapper.sh"
       bass source "$NPM_ROOT/claude-config-changer/shell-wrapper.sh"
   end
   ```

4. **重新加载配置**：
   ```bash
   source ~/.bashrc   # 或 source ~/.zshrc
   ```

### 第四步：添加你的 Claude API 配置

#### Windows PowerShell 用户

在你的PowerShell配置文件（`$PROFILE`）中添加Claude API配置：

```powershell
# Claude API 配置组

# 官方 API
# $env:ANTHROPIC_BASE_URL="https://api.anthropic.com"
# $env:ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的官方API密钥"

# 代理服务 1
$env:ANTHROPIC_BASE_URL="https://your-proxy1.com"
$env:ANTHROPIC_AUTH_TOKEN="你的代理密钥1"

# 代理服务 2
# $env:ANTHROPIC_BASE_URL="https://your-proxy2.com"
# $env:ANTHROPIC_AUTH_TOKEN="你的代理密钥2"

# 测试环境
# $env:ANTHROPIC_BASE_URL="https://test-api.com"
# $env:ANTHROPIC_AUTH_TOKEN="测试密钥"
```

#### macOS/Linux 用户

在你的Shell配置文件中添加Claude API配置：

```bash
# Claude API 配置组

# 官方 API
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的官方API密钥"

# 代理服务 1
export ANTHROPIC_BASE_URL="https://your-proxy1.com"
export ANTHROPIC_AUTH_TOKEN="你的代理密钥1"

# 代理服务 2
# export ANTHROPIC_BASE_URL="https://your-proxy2.com"
# export ANTHROPIC_AUTH_TOKEN="你的代理密钥2"

# 测试环境
# export ANTHROPIC_BASE_URL="https://test-api.com"
# export ANTHROPIC_AUTH_TOKEN="测试密钥"
```

**重要说明：**
- ⚠️ **所有配置都必须用 `#` 注释掉**，工具会自动激活你选择的配置
- ✅ **当前激活的配置**是没有 `#` 号的那一组
- 📝 **配置组名称**：每组配置前的注释（如 `# 官方 API`）就是在菜单中显示的名称
- 🔄 **保存后立即生效**：保存文件后立即可以使用

## 📱 如何使用

### 切换配置

在终端中输入：
```bash
ccc
```

你会看到类似这样的菜单：
```
🔧 Claude 配置切换器
选择要激活的配置:

? 选择 Claude 配置:
> 🟢 代理服务 1 (active)
  ⚪ 官方 API
  ⚪ 代理服务 2
  ⚪ 测试环境
  ──────────────
  Exit
```

- 🟢 表示当前激活的配置
- ⚪ 表示可选择的其他配置
- 使用 ↑↓ 箭头键选择，回车确认

### 启动 Claude Code

配置切换完成后，使用以下命令启动 Claude：
```bash
ccs
```

`ccs` 命令的特点：
- 📡 **自动应用当前配置** - 使用你刚才选择的API配置
- 🔄 **支持热重载** - 如果你在使用过程中切换了配置，会自动提示
- 🚀 **完全兼容** - 支持所有 claude 命令的参数

### 实际使用流程

1. **切换到你想要的配置**
   ```bash
   ccc
   # 选择 "代理服务 1"
   ```

2. **启动 Claude Code**
   ```bash
   ccs
   ```

3. **如果需要切换到其他配置**
   - 在另一个终端窗口运行 `ccc` 切换配置
   - 原来的 Claude 会提示配置已更改
   - 结束当前对话，重新运行 `ccs`

## 🛠️ 命令参考

### `ccc` - 配置切换器

```bash
ccc                    # 显示配置选择菜单
ccc --help            # 显示帮助信息
ccc --config /path    # 使用指定路径的配置文件
```

### `ccs` - Claude Code 启动器

```bash
ccs                   # 启动 Claude Code
ccs --help           # 显示 Claude 帮助
ccs --version        # 显示 Claude 版本
ccs [任何claude参数] # 传递参数给 Claude
```

## ❓ 常见问题

### Q: 安装后提示找不到命令怎么办？

**A:** 请尝试以下步骤：

1. **确认全局安装成功**：
   ```bash
   npm list -g claude-config-changer
   ```

2. **检查npm全局路径**：
   ```bash
   npm root -g
   ```

3. **重新打开终端窗口**

4. **手动刷新配置**：
   ```powershell
   # Windows PowerShell
   . $PROFILE
   ```
   ```bash
   # macOS/Linux
   source ~/.bashrc  # 或 ~/.zshrc
   ```

5. **检查安装是否成功**：
   ```bash
   ccc --help
   ```

### Q: 配置菜单是空的或者显示错误？

**A:** 请检查配置文件格式：

1. **确保语法正确**：
   - Windows: 使用 `$env:变量名="值"`
   - macOS/Linux: 使用 `export 变量名="值"`

2. **确保有配置组名称**：
   ```bash
   # 正确 ✅
   # 我的代理
   # export ANTHROPIC_BASE_URL="https://..."

   # 错误 ❌ (缺少组名称)
   # export ANTHROPIC_BASE_URL="https://..."
   ```

3. **检查文件编码**：确保配置文件是 UTF-8 编码

### Q: 切换配置后没有生效？

**A:** 请确认：

1. **查看切换确认信息**：切换成功后会显示绿色的确认消息
2. **重新启动 Claude**：结束当前的 `ccs` 进程，重新运行
3. **检查环境变量**：
   ```bash
   # 查看当前配置
   echo $ANTHROPIC_BASE_URL      # macOS/Linux
   echo $env:ANTHROPIC_BASE_URL  # Windows PowerShell
   ```

### Q: Windows 上提示权限错误？

**A:** 请尝试：

1. **以管理员身份运行 PowerShell**
2. **允许脚本执行**：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **重新安装包**：
   ```powershell
   npm install -g claude-config-changer
   ```

### Q: npm安装失败怎么办？

**A:** 请尝试：

1. **检查网络连接**
2. **使用国内镜像**：
   ```bash
   npm install -g claude-config-changer --registry=https://registry.npmmirror.com
   ```
3. **清理npm缓存**：
   ```bash
   npm cache clean --force
   ```
4. **更新npm版本**：
   ```bash
   npm install -g npm@latest
   ```

### Q: 我可以添加多少个配置？

**A:** 理论上没有限制。你可以添加任意数量的配置组，每个配置组包含：
- 一个描述性的名称（注释行）
- API 基础 URL
- 认证令牌

### Q: 配置文件存储在哪里？

**A:** 配置存储在系统的 Shell 配置文件中：
- **Windows PowerShell**: `$PROFILE` (通常是 `Documents\PowerShell\Microsoft.PowerShell_profile.ps1`)
- **macOS/Linux**: `~/.bashrc` 或 `~/.zshrc`

## 🔧 高级使用

### 自定义配置文件位置

如果你想使用不同位置的配置文件：

```bash
ccc --config /path/to/your/config/file
```

### 在脚本中使用

你可以在自动化脚本中使用这些工具：

```bash
#!/bin/bash

# 切换到生产环境配置
echo "切换到生产环境..."
# 注意：ccc 在脚本中需要手动配置

# 启动 Claude 处理任务
echo "启动 Claude 处理..."
ccs --version
```

### 卸载

如果需要完全卸载：

```bash
# 卸载全局包
npm uninstall -g claude-config-changer

# 手动删除配置文件中的相关内容
# Windows: 编辑 $PROFILE
# macOS/Linux: 编辑 ~/.bashrc 或 ~/.zshrc
```

### 更新

更新到最新版本：

```bash
npm update -g claude-config-changer
```

### 备份和恢复配置

**备份配置**：
```bash
# Windows
copy $PROFILE backup_profile.ps1

# macOS/Linux
cp ~/.bashrc ~/.bashrc.backup
```

**恢复配置**：
```bash
# Windows
copy backup_profile.ps1 $PROFILE

# macOS/Linux
cp ~/.bashrc.backup ~/.bashrc
```

## 📦 开发者信息

### 版本信息

```bash
# 查看当前版本
npm list -g claude-config-changer

# 查看所有版本
npm view claude-config-changer versions --json
```

### 本地开发

如果你想从源码安装或参与开发：

```bash
# 克隆项目
git clone https://github.com/zuogl/claudeCodeConfigChanger.git
cd claudeCodeConfigChanger

# 安装依赖
npm install

# 本地链接
npm link

# 运行测试
npm test
```

## 🤝 获取帮助

如果遇到问题：

1. **查看命令帮助**：
   ```bash
   ccc --help
   ccs --help
   ```

2. **检查配置文件**：确保格式正确

3. **提交问题**：访问 [GitHub Issues](https://github.com/zuogl/claudeCodeConfigChanger/issues)

4. **查看日志**：运行命令时注意错误消息

5. **检查npm包状态**：
   ```bash
   npm list -g claude-config-changer
   npm outdated -g claude-config-changer
   ```

## 📜 许可证

MIT License - 免费使用，欢迎贡献代码！

## 💝 致谢

感谢所有为这个项目贡献想法和代码的朋友们！

---

**快速提醒**：
- 📦 推荐使用 `npm install -g claude-config-changer` 全局安装
- ⚙️ 记得配置Shell环境以启用命令包装器
- 🔧 首次使用前，请确保在配置文件中正确添加了你的 Claude API 信息
- 💡 所有配置都要先用 `#` 注释掉，工具会自动激活你选择的配置！