@echo off
REM Claude Config Changer - Windows 快速安装脚本

echo ====================================
echo Claude Config Changer Windows 安装
echo ====================================
echo.

REM 检查 PowerShell 是否可用
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到 PowerShell
    echo 请确保 Windows PowerShell 已安装
    pause
    exit /b 1
)

REM 运行 PowerShell 安装脚本
echo 正在启动安装程序...
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"

pause