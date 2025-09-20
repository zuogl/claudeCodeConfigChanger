#!/usr/bin/env node

const path = require('path');
const ConfigParser = require('../lib/config-parser');
const InteractiveMenu = require('../lib/interactive');
const { notifyClaudeCodeProcesses } = require('../lib/config-watcher');

const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Determine the shell config file
function getConfigPath() {
    const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
    const platform = process.platform;

    try {
        // Windows specific handling
        if (platform === 'win32') {
            // Check for various Windows shells
            const windowsConfigs = [
                // PowerShell profiles
                {
                    shell: 'powershell',
                    paths: [
                        path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
                        path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
                    ]
                },
                // Git Bash
                {
                    shell: 'bash',
                    paths: [
                        path.join(home, '.bashrc'),
                        path.join(home, '.bash_profile')
                    ]
                },
                // WSL detection
                {
                    shell: 'wsl',
                    paths: [
                        path.join(home, '.bashrc'),
                        path.join(home, '.zshrc')
                    ]
                },
                // Command Prompt (using AUTORUN registry)
                {
                    shell: 'cmd',
                    paths: [
                        path.join(home, 'autorun.cmd'),
                        path.join(home, 'autorun.bat')
                    ]
                }
            ];

            // Try to detect which shell is being used
            const parentProcess = process.env.TERM_PROGRAM || process.env.SHELL_NAME || '';
            const psModulePath = process.env.PSModulePath;
            const isGitBash = process.env.MSYSTEM || process.env.MINGW_PREFIX;
            const isWSL = process.env.WSL_DISTRO_NAME || fs.existsSync('/proc/version');

            // Determine the active shell
            let activeShell = null;
            if (psModulePath) {
                activeShell = 'powershell';
            } else if (isGitBash) {
                activeShell = 'bash';
            } else if (isWSL) {
                activeShell = 'wsl';
            } else if (process.env.ComSpec && process.env.ComSpec.includes('cmd.exe')) {
                activeShell = 'cmd';
            }

            // Find matching config
            if (activeShell) {
                const config = windowsConfigs.find(c => c.shell === activeShell);
                if (config) {
                    for (const configPath of config.paths) {
                        if (fs.existsSync(configPath)) {
                            return configPath;
                        }
                    }
                    // Return first option for creation if none exist
                    return config.paths[0];
                }
            }

            // Fallback: check for any existing config
            for (const config of windowsConfigs) {
                for (const configPath of config.paths) {
                    if (fs.existsSync(configPath)) {
                        return configPath;
                    }
                }
            }

            // Default to PowerShell profile on Windows
            return path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
        }

        // Unix-like systems (macOS, Linux)
        // Method 1: Get user's default shell from system
        let userShell = process.env.SHELL;

        // On macOS/Linux, also try to get from /etc/passwd or dscl
        if (!userShell) {
            try {
                if (platform === 'darwin') {
                    // macOS: use dscl to get user's shell
                    const username = process.env.USER || process.env.LOGNAME;
                    userShell = execSync(`dscl . -read /Users/${username} UserShell`, { encoding: 'utf8' })
                        .split(':')[1]?.trim();
                } else {
                    // Linux: read from /etc/passwd
                    const username = process.env.USER || process.env.LOGNAME;
                    const passwdContent = fs.readFileSync('/etc/passwd', 'utf8');
                    const userLine = passwdContent.split('\n').find(line => line.startsWith(username + ':'));
                    if (userLine) {
                        userShell = userLine.split(':')[6];
                    }
                }
            } catch (e) {
                // Fallback to $SHELL environment variable
                userShell = process.env.SHELL;
            }
        }

        // Method 2: Determine config file based on shell
        if (userShell) {
            const shellName = path.basename(userShell);

            // Direct mapping based on shell executable name
            const configMap = {
                'zsh': ['.zshrc', '.zprofile'],
                'bash': ['.bashrc', '.bash_profile', '.profile'],
                'fish': ['.config/fish/config.fish'],
                'ksh': ['.kshrc', '.profile'],
                'tcsh': ['.tcshrc', '.cshrc'],
                'csh': ['.cshrc'],
                'sh': ['.profile'],
                'dash': ['.profile']
            };

            // Find matching config files
            for (const [shell, configs] of Object.entries(configMap)) {
                if (shellName.includes(shell)) {
                    // Check which config file exists and is most recently modified
                    let bestConfig = null;
                    let bestMtime = 0;

                    for (const config of configs) {
                        const configPath = path.join(home, config);
                        try {
                            const stats = fs.statSync(configPath);
                            if (stats.mtime > bestMtime) {
                                bestConfig = configPath;
                                bestMtime = stats.mtime;
                            }
                        } catch (e) {
                            // File doesn't exist, continue
                        }
                    }

                    if (bestConfig) {
                        return bestConfig;
                    }

                    // Return first option if none exist yet
                    return path.join(home, configs[0]);
                }
            }
        }

        // Method 3: Auto-detect by checking which files exist
        const commonConfigs = [
            '.zshrc',
            '.bashrc',
            '.bash_profile',
            '.profile',
            '.config/fish/config.fish'
        ];

        for (const config of commonConfigs) {
            const configPath = path.join(home, config);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

    } catch (error) {
        console.warn('Warning: Could not detect shell configuration:', error.message);
    }

    // Ultimate fallback
    return path.join(home, '.bashrc');
}

// Check for command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Claude Config Changer (ccc)

Usage: ccc [options]

Options:
  -h, --help     Show this help message
  --config <path>  Specify custom config file path

Examples:
  ccc              Show interactive menu
  ccc --config ~/.custom-profile  Use custom config file
`);
    process.exit(0);
}

// Get config file path from command line or auto-detect
let configPath = getConfigPath();
const configIndex = args.indexOf('--config');
if (configIndex !== -1 && args[configIndex + 1]) {
    configPath = args[configIndex + 1];
}

// Create instances and run
const configParser = new ConfigParser(configPath);
const menu = new InteractiveMenu(configParser);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught Exception:', error);
    process.exit(1);
});

// Run the interactive menu and set exit code based on whether config changed
menu.showSelectionMenu()
    .then(changed => {
        // Exit 0 only when configuration actually changed; non-zero otherwise
        process.exit(changed ? 0 : 2);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    });
