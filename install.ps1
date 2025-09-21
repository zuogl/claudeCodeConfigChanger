# Claude Config Changer - Windows Installation Script
# Run with Administrator privileges if needed

param(
    [switch]$Force,
    [string]$ProfilePath
)

$ErrorActionPreference = "Stop"

Write-Host "Claude Config Changer Windows Installer" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[OK] Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is required" -ForegroundColor Red
    Write-Host "Please visit https://nodejs.org to download and install Node.js" -ForegroundColor Yellow
    exit 1
}

# Get script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
Push-Location $SCRIPT_DIR
try {
    npm install --production
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# Determine PowerShell profile path
if ($ProfilePath) {
    $PROFILE_PATH = $ProfilePath
} else {
    $PROFILE_PATH = $PROFILE.CurrentUserAllHosts
    if (-not $PROFILE_PATH) {
        $PROFILE_PATH = "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
    }
}

Write-Host "Profile path: $PROFILE_PATH" -ForegroundColor Cyan

# Create profile directory if it doesn't exist
$profileDir = Split-Path -Parent $PROFILE_PATH
if (-not (Test-Path $profileDir)) {
    Write-Host "Creating profile directory: $profileDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Check if profile file exists
if (-not (Test-Path $PROFILE_PATH)) {
    Write-Host "Creating PowerShell profile..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $PROFILE_PATH -Force | Out-Null
}

# Read existing profile
$profileContent = Get-Content $PROFILE_PATH -Raw -ErrorAction SilentlyContinue
if (-not $profileContent) {
    $profileContent = ""
}

# Check if already installed
$CCC_MARKER = "# Claude Config Changer"
if ($profileContent -match [regex]::Escape($CCC_MARKER)) {
    if ($Force) {
        Write-Host "[WARNING] Already installed, updating..." -ForegroundColor Yellow
        # Remove old installation
        $profileContent = $profileContent -replace "(?ms)$CCC_MARKER.*?# END Claude Config Changer.*?\r?\n", ""
    } else {
        Write-Host "[WARNING] Claude Config Changer is already installed" -ForegroundColor Yellow
        Write-Host "Use -Force parameter to reinstall" -ForegroundColor Yellow
        exit 0
    }
}

# Prepare installation content
$wrapperPath = Join-Path $SCRIPT_DIR "shell-wrapper.ps1"
$installContent = @"

$CCC_MARKER
# Auto-generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Source the wrapper functions
if (Test-Path "$wrapperPath") {
    . "$wrapperPath"
} else {
    Write-Warning "Claude Config Changer wrapper not found at: $wrapperPath"
}
# END Claude Config Changer

"@

# Add to profile
Write-Host "Updating PowerShell profile..." -ForegroundColor Cyan
Add-Content -Path $PROFILE_PATH -Value $installContent -NoNewline

# Create sample configuration if needed
Write-Host ""
Write-Host "Checking Claude API configuration..." -ForegroundColor Cyan

# Check if current profile has ANTHROPIC_ configuration
if ($profileContent -notmatch "ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN") {
    Write-Host ""
    Write-Host "[TIP] Add the following to your PowerShell profile to configure Claude API:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# Claude API Configuration Example" -ForegroundColor Gray
    Write-Host '# Config 1 - Default' -ForegroundColor Gray
    Write-Host '# $env:ANTHROPIC_BASE_URL="https://api.anthropic.com"' -ForegroundColor Gray
    Write-Host '# $env:ANTHROPIC_AUTH_TOKEN="your-api-key-here"' -ForegroundColor Gray
    Write-Host ""
    Write-Host '# Config 2 - Custom' -ForegroundColor Gray
    Write-Host '# $env:ANTHROPIC_BASE_URL="https://your-custom-endpoint.com"' -ForegroundColor Gray
    Write-Host '# $env:ANTHROPIC_AUTH_TOKEN="your-custom-token"' -ForegroundColor Gray
    Write-Host ""
}

# Install global commands (optional)
Write-Host ""
$installGlobal = Read-Host "Install ccc and ccs commands globally? (y/n)"
if ($installGlobal -eq 'y' -or $installGlobal -eq 'Y') {
    Write-Host "Installing global commands..." -ForegroundColor Cyan
    Push-Location $SCRIPT_DIR
    try {
        npm link
        Write-Host "[OK] Global commands installed" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Global installation failed, but local installation is complete" -ForegroundColor Yellow
        Write-Host "You can still use ccc and ccs commands in new PowerShell sessions" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
}

# Complete
Write-Host ""
Write-Host "[SUCCESS] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  1. Open a new PowerShell window" -ForegroundColor White
Write-Host "  2. Run 'ccc' to switch Claude configuration" -ForegroundColor White
Write-Host "  3. Run 'ccs' to start Claude (with selected config)" -ForegroundColor White
Write-Host "     Note: ccs = Claude Code Starter" -ForegroundColor Gray
Write-Host ""
Write-Host "Tip: If commands are not available, restart PowerShell or run:" -ForegroundColor Yellow
Write-Host '  . $PROFILE' -ForegroundColor Gray
Write-Host ""