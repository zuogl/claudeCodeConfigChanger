# Claude Config Changer PowerShell Wrapper
# This file should be sourced in your PowerShell profile

function ccc {
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )

    # Save current environment
    $OLD_ANTHROPIC_BASE_URL = $env:ANTHROPIC_BASE_URL
    $OLD_ANTHROPIC_AUTH_TOKEN = $env:ANTHROPIC_AUTH_TOKEN

    # Determine install path
    $installPath = if ($global:CCC_HOME) {
        $global:CCC_HOME
    } else {
        # Fallback to npm global path
        $npmRoot = & npm root -g
        Join-Path $npmRoot "claude-config-changer"
    }

    # Run the actual ccc command
    & node (Join-Path $installPath "bin\ccc.js") @Arguments

    # Check if the command was successful
    if ($LASTEXITCODE -eq 0) {
        # Reload the PowerShell profile to get new environment variables
        $profilePath = $PROFILE

        # Try different profile locations
        if (Test-Path $profilePath) {
            . $profilePath | Out-Null
        } elseif (Test-Path "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1") {
            . "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1" | Out-Null
        } elseif (Test-Path "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1") {
            . "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1" | Out-Null
        }

        # Check if environment actually changed
        if ($OLD_ANTHROPIC_BASE_URL -ne $env:ANTHROPIC_BASE_URL) {
            Write-Host ""
            Write-Host "[OK] Configuration reloaded in current shell!" -ForegroundColor Green
            Write-Host "New API URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor Cyan
        }
    }
}

# ccs launcher: ccs [claude args] - Claude Code Starter
function ccs {
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )

    if ($Arguments -contains "--help" -or $Arguments -contains "-h") {
        Write-Host "Usage: ccs [claude args]"
        Write-Host "  ccs                - Start Claude with current config"
        Write-Host "  ccs --help         - Show Claude help"
        return
    }

    # Determine install path
    $installPath = if ($global:CCC_HOME) {
        $global:CCC_HOME
    } else {
        # Fallback to npm global path
        $npmRoot = & npm root -g
        Join-Path $npmRoot "claude-config-changer"
    }

    # Run our Node launcher
    & node (Join-Path $installPath "bin\ccs.js") @Arguments
}

# Functions are automatically available when this script is dot-sourced
# No need for Export-ModuleMember in a regular script