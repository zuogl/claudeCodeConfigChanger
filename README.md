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


### 第三步：配置Shell环境

#### Windows PowerShell 用户（详细步骤）

##### 1. 打开 PowerShell（管理员模式）

   1. **打开搜索**：点击 Windows 开始菜单，或按 `Windows键`
   2. **搜索 PowerShell**：在搜索框中输入 `powershell`
   3. **以管理员身份运行**：
      - 在搜索结果中找到 "Windows PowerShell"
      - 右键点击它
      - 选择 "以管理员身份运行"
      - 如果弹出用户账户控制窗口，点击 "是"

##### 2. 检查并创建 PowerShell 配置文件

   在打开的 PowerShell 窗口中，我们需要先检查是否已经存在配置文件。

   **第一步：检查配置文件是否存在**

   复制并粘贴以下命令，然后按回车：
   ```powershell
   Test-Path $PROFILE
   ```

   - 如果显示 `True`：说明配置文件已存在，跳到第3步
   - 如果显示 `False`：说明配置文件不存在，继续下面的步骤

   **第二步：创建配置文件（仅在上一步显示 False 时执行）**

   复制并粘贴以下命令，然后按回车：
   ```powershell
   New-Item -Type File -Path $PROFILE -Force
   ```

   你会看到类似这样的输出：
   ```
   目录: C:\Users\你的用户名\Documents\WindowsPowerShell

   Mode                LastWriteTime         Length Name
   ----                -------------         ------ ----
   -a----              2024/1/1     12:00          0 Microsoft.PowerShell_profile.ps1
   ```

##### 3. 编辑配置文件

   **打开配置文件进行编辑**

   复制并粘贴以下命令，然后按回车：
   ```powershell
   notepad $PROFILE
   ```

   这会打开记事本。如果是新文件，记事本会是空白的。

##### 4. 添加 Shell 包装器代码

   **在记事本中添加以下内容**（直接复制粘贴整段代码）：

   ```powershell
   # Claude Config Changer - PowerShell wrapper
   # 这段代码让 ccc 和 ccs 命令在 PowerShell 中可用

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

   **保存文件**：
   - 按 `Ctrl + S` 保存
   - 关闭记事本

##### 5. 激活配置

   **重新加载配置文件**

   回到 PowerShell 窗口，复制并粘贴以下命令，然后按回车：
   ```powershell
   . $PROFILE
   ```

   如果没有错误消息，说明配置成功！

##### 6. 验证安装

   **测试命令是否可用**

   输入以下命令测试：
   ```powershell
   ccc --help
   ```

   如果看到帮助信息，恭喜你，配置成功！

##### ⚠️ 常见问题解决

   **如果遇到 "无法加载文件" 的错误：**

   这是因为 PowerShell 的执行策略限制。运行以下命令解决：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

   输入 `Y` 确认，然后重新执行第5步。

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

### 第四步：添加你的 Claude API 配置（重要！）

这一步非常重要，你需要添加你的 Claude API 信息，否则工具无法工作。

#### Windows PowerShell 用户（详细步骤）

##### 1. 再次打开配置文件

在 PowerShell 窗口中运行：
```powershell
notepad $PROFILE
```

##### 2. 在文件中添加你的 API 配置

**重要提示**：如果文件中已经有第三步添加的包装器代码，请在它的**下方**添加以下内容。

找一个空行，然后粘贴以下模板（根据你的实际情况修改）：

```powershell
# ===== Claude API 配置组 =====
# 说明：每个配置组代表一个不同的API服务
# 重要：所有配置都要用 # 号注释掉，工具会自动激活你选择的配置

# 官方 API（如果你有官方API密钥）
# $env:ANTHROPIC_BASE_URL="https://api.anthropic.com"
# $env:ANTHROPIC_AUTH_TOKEN="sk-ant-api03-在这里填写你的官方密钥"

# 代理服务 1（你的第一个代理服务）
# $env:ANTHROPIC_BASE_URL="https://你的代理地址.com"
# $env:ANTHROPIC_AUTH_TOKEN="你的代理密钥"

# 代理服务 2（如果你有多个代理服务）
# $env:ANTHROPIC_BASE_URL="https://另一个代理地址.com"
# $env:ANTHROPIC_AUTH_TOKEN="另一个代理密钥"

# 测试环境（可选，用于测试）
# $env:ANTHROPIC_BASE_URL="https://test-api.com"
# $env:ANTHROPIC_AUTH_TOKEN="测试密钥"
```

##### 3. 修改为你的实际配置

**示例：假设你有两个API服务**

```powershell
# ===== Claude API 配置组 =====

# 春秋中转站
# $env:ANTHROPIC_BASE_URL="https://xxxxoxue.com"
# $env:ANTHROPIC_AUTH_TOKEN="sk-xxxxxxx"

# 智谱GLM
# $env:ANTHROPIC_BASE_URL="https://open.bigmodel.cnxxxxxx"
# $env:ANTHROPIC_AUTH_TOKEN="xxxxxxxxxx"
```

**注意事项**：
- ⚠️ **每个配置都必须用 `#` 开头**（这是注释符号）
- 📝 **配置名称**（如"春秋中转站"）会在菜单中显示
- 🔑 **替换示例中的URL和密钥为你自己的**
- ✅ **保存文件**：按 `Ctrl + S` 保存，然后关闭记事本

##### 4. 重新加载配置

在 PowerShell 窗口中运行：
```powershell
. $PROFILE
```

#### macOS/Linux 用户

##### 1. 打开配置文件

```bash
# 对于 bash 用户
nano ~/.bashrc

# 对于 zsh 用户（macOS 默认）
nano ~/.zshrc
```

##### 2. 添加你的 API 配置

在文件末尾添加（根据你的实际情况修改）：

```bash
# ===== Claude API 配置组 =====
# 说明：每个配置组代表一个不同的API服务
# 重要：所有配置都要用 # 号注释掉，工具会自动激活你选择的配置

# 官方 API（如果你有官方API密钥）
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-在这里填写你的官方密钥"

# 代理服务 1（你的第一个代理服务）
# export ANTHROPIC_BASE_URL="https://你的代理地址.com"
# export ANTHROPIC_AUTH_TOKEN="你的代理密钥"

# 代理服务 2（如果你有多个代理服务）
# export ANTHROPIC_BASE_URL="https://另一个代理地址.com"
# export ANTHROPIC_AUTH_TOKEN="另一个代理密钥"
```

##### 3. 保存文件

- 按 `Ctrl + X` 退出
- 按 `Y` 确认保存
- 按 `Enter` 确认文件名

##### 4. 重新加载配置

```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

**重要说明：**
- ⚠️ **所有配置都必须用 `#` 注释掉**，工具会自动激活你选择的配置
- ✅ **当前激活的配置**是没有 `#` 号的那一组
- 📝 **配置组名称**：每组配置前的注释（如 `# 官方 API`）就是在菜单中显示的名称
- 🔄 **保存后立即生效**：保存文件后立即可以使用

## 📱 如何使用（超简单！）

完成上述配置后，你就可以开始使用了！整个过程只需要两个命令：`ccc` 和 `ccs`

### 第一步：切换配置（使用 ccc 命令）

#### 1. 打开终端或 PowerShell

- **Windows 用户**：按 `Windows键 + R`，输入 `powershell`，按回车
- **macOS 用户**：按 `Command + 空格`，输入 `terminal`，按回车
- **Linux 用户**：按 `Ctrl + Alt + T` 打开终端

#### 2. 运行配置切换命令

输入以下命令并按回车：
```bash
ccc
```

#### 3. 选择你要使用的配置

你会看到一个交互式菜单，类似这样：

```
🔧 Claude 配置切换器
选择要激活的配置:

? 选择 Claude 配置: (使用箭头键选择)
❯ 🟢 春秋中转站 (active)     ← 当前激活的配置（绿色圆点）
  ⚪ 智谱GLM               ← 可选配置（白色圆点）
  ⚪ 官方 API              ← 可选配置
  ⚪ 测试环境              ← 可选配置
  ──────────────
  Exit                    ← 退出不做修改
```

**操作方法**：
- 按 `↑` `↓` **箭头键**移动选择
- 按 **回车键**确认选择
- 选择 `Exit` 或按 `Ctrl + C` 退出

#### 4. 确认切换成功

选择后，你会看到成功消息：
```
⏳ 正在切换到 "智谱GLM"...
✅ 配置更新成功!
📍 当前使用: 智谱GLM
```

### 第二步：启动 Claude Code（使用 ccs 命令）

配置切换完成后，在同一个窗口输入：
```bash
ccs
```

然后按回车，Claude Code 就会使用你刚选择的配置启动！

### 完整使用示例

假设你要从"春秋中转站"切换到"智谱GLM"并开始使用：

```powershell
# 步骤 1：查看并切换配置
PS C:\> ccc

🔧 Claude 配置切换器
选择要激活的配置:

? 选择 Claude 配置: 智谱GLM    # ← 选择智谱GLM，按回车

⏳ 正在切换到 "智谱GLM"...
✅ 配置更新成功!
📍 当前使用: 智谱GLM

# 步骤 2：启动 Claude
PS C:\> ccs

# Claude Code 启动，现在使用的是智谱GLM的API
```

### 高级技巧

#### 1. 快速查看当前配置

运行 `ccc` 时，带有 🟢 绿色圆点的就是当前配置。

#### 2. 在使用中切换配置（热重载）

如果你正在使用 Claude，想切换到其他API：

1. **新开一个终端窗口**（保持 Claude 运行）
2. 在新窗口运行 `ccc` 切换配置
3. Claude 会显示提示：
   ```
   🔄 检测到配置变化，环境变量已更新:
   Base URL: https://新的API地址
   Auth Token: 已设置
   提示: 请使用ctrl(^) + c 结束本次对话，然后使用ccs开启新的对话
   ```
4. 按 `Ctrl + C` 结束当前 Claude
5. 运行 `ccs` 使用新配置重新启动

#### 3. 直接传递参数给 Claude

`ccs` 命令支持所有 Claude 的原生参数：

```bash
# 查看 Claude 版本
ccs --version

# 查看帮助
ccs --help

# 其他 Claude 参数
ccs [任何claude支持的参数]
```

### ⚠️ 使用注意事项

1. **首次使用前**：确保已完成第四步的 API 配置
2. **配置不显示**：检查配置文件格式是否正确
3. **命令找不到**：重新打开终端窗口，或运行 `. $PROFILE`（Windows）或 `source ~/.bashrc`（Linux/macOS）

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