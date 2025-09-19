const inquirer = require('inquirer');
const chalk = require('chalk');
const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');

class InteractiveMenu {
    constructor(configParser) {
        this.configParser = configParser;
    }

    async showSelectionMenu() {
        try {
            console.log(chalk.cyan('\n🔧 Claude Config Changer'));
            console.log(chalk.gray('Select a configuration to activate:\n'));

            const groups = await this.configParser.getAvailableGroups();

            if (groups.length === 0) {
                console.log(chalk.red('❌ No Claude configurations found in your config file!'));
                console.log(chalk.yellow('\nPlease add configurations in this format:'));
                console.log(chalk.gray('# Configuration Name'));
                console.log(chalk.gray('# export ANTHROPIC_BASE_URL="https://..."'));
                console.log(chalk.gray('# export ANTHROPIC_AUTH_TOKEN="..."'));
                return;
            }

            const choices = groups.map(group => {
                const prefix = group.isActive ? '🟢 ' : '⚪ ';
                const name = group.isActive ? `${group.name} ${chalk.green('(active)')}` : group.name;
                return {
                    name: prefix + name,
                    value: group.name,
                    short: group.name
                };
            });

            const answer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedGroup',
                    message: 'Choose Claude configuration:',
                    choices: [
                        ...choices,
                        new inquirer.Separator(),
                        {
                            name: chalk.red('Exit'),
                            value: null
                        }
                    ],
                    pageSize: 15
                }
            ]);

            if (answer.selectedGroup) {
                await this.switchToGroup(answer.selectedGroup);
            } else {
                console.log(chalk.gray('\n👋 Goodbye!'));
            }
        } catch (error) {
            console.error(chalk.red('\n❌ Error:'), error.message);
            if (error.message.includes('ENOENT')) {
                console.log(chalk.yellow('\nMake sure your shell config file exists at:'), error.message.match(/:(.+)$/)?.[1]);
            }
        }
    }

    async switchToGroup(groupName) {
        console.log(chalk.yellow(`\n⏳ Switching to "${groupName}"...`));

        try {
            const group = await this.configParser.switchGroup(groupName);

            console.log(chalk.green('\n✅ Configuration updated successfully!'));
            console.log(chalk.cyan(`\n📍 Now using: ${group.name}`));

            // Extract the values from the group
            const baseUrlLine = group.lines.find(line =>
                line.trim().startsWith('export ANTHROPIC_BASE_URL=')
            );
            const tokenLine = group.lines.find(line =>
                line.trim().startsWith('export ANTHROPIC_AUTH_TOKEN=')
            );

            if (baseUrlLine) {
                const url = baseUrlLine.match(/"([^"]+)"/)?.[1];
                console.log(chalk.gray(`   Base URL: ${url || 'N/A'}`));
            }
            if (tokenLine) {
                const token = tokenLine.match(/"([^"]+)"/)?.[1];
                const maskedToken = token ? `${token.substring(0, 8)}...` : 'N/A';
                console.log(chalk.gray(`   Auth Token: ${maskedToken}`));
            }

            // Auto-refresh the configuration
            await this.autoRefreshConfig();

            // Notify running Claude Code processes about the config change
            console.log(chalk.yellow('\n📡 Notifying running Claude Code instances...'));
            try {
                const { notifyClaudeCodeProcesses } = require('./config-watcher');
                const notified = await notifyClaudeCodeProcesses(configPath);
                if (notified.length > 0) {
                    console.log(chalk.green(`✅ Notified ${notified.length} running Claude Code process(es) to reload configuration`));
                } else {
                    console.log(chalk.gray('   No running Claude Code processes found'));
                }
            } catch (error) {
                console.log(chalk.gray('   Could not notify Claude Code processes:', error.message));
            }
        } catch (error) {
            console.error(chalk.red('\n❌ Failed to switch configuration:'), error.message);
        }
    }

    async autoRefreshConfig() {
        const configPath = this.configParser.configPath;
        const shellName = path.basename(process.env.SHELL || '');
        const platform = process.platform;

        try {
            // For Windows PowerShell
            if (platform === 'win32') {
                if (process.env.PSModulePath) {
                    // PowerShell
                    console.log(chalk.yellow('\n🔄 Refreshing PowerShell configuration...'));
                    execSync(`powershell -Command ". '${configPath}'"`, { stdio: 'inherit' });
                    console.log(chalk.green('✅ PowerShell configuration refreshed!'));
                } else if (process.env.MSYSTEM || process.env.MINGW_PREFIX) {
                    // Git Bash
                    console.log(chalk.yellow('\n🔄 Refreshing Git Bash configuration...'));
                    execSync(`source "${configPath}"`, { shell: '/bin/bash', stdio: 'inherit' });
                    console.log(chalk.green('✅ Git Bash configuration refreshed!'));
                } else {
                    // CMD - cannot source, need restart
                    console.log(chalk.yellow('\n⚠️  CMD does not support auto-refresh.'));
                    console.log(chalk.yellow('Please restart your terminal to apply changes.'));
                    return;
                }
            } else {
                // Unix-like systems
                // Try to update the current shell's environment
                console.log(chalk.yellow('\n🔄 Applying configuration to current session...'));

                // Read the config file and extract the active exports
                const fs = require('fs');
                const configContent = fs.readFileSync(configPath, 'utf8');
                const lines = configContent.split('\n');

                let inActiveBlock = false;
                const exports = [];

                for (const line of lines) {
                    if (line.includes('# [ACTIVE]')) {
                        inActiveBlock = true;
                    } else if (inActiveBlock && line.startsWith('#') && !line.includes('export')) {
                        inActiveBlock = false;
                    } else if (inActiveBlock && line.startsWith('export ')) {
                        exports.push(line);
                    }
                }

                // Apply exports to current process
                for (const exportLine of exports) {
                    const match = exportLine.match(/export\s+(\w+)="([^"]*)"/);;
                    if (match) {
                        const [, key, value] = match;
                        process.env[key] = value;
                        console.log(chalk.gray(`   Set ${key}`));
                    }
                }

                console.log(chalk.green('\n✅ Configuration applied to current session!'));
                console.log(chalk.yellow('\n💡 Note: This only affects the current process.'));
                console.log(chalk.yellow('   For new terminals, run: source ' + configPath));
                console.log(chalk.yellow('   Or restart your terminal.'));
            }
        } catch (error) {
            // Fallback message if auto-refresh fails
            console.log(chalk.yellow('\n⚠️  Could not auto-refresh configuration.'));
            console.log(chalk.yellow(`💡 Please run: source ${configPath}`));
            console.log(chalk.yellow('   Or restart your terminal to apply changes.'));

            if (process.env.DEBUG) {
                console.error(chalk.gray('Debug:', error.message));
            }
        }
    }
}

module.exports = InteractiveMenu;