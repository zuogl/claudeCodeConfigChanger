const inquirer = require('inquirer');
const chalk = require('chalk');
// No shell-level auto-refresh here; handled by outer wrapper

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
                return false;
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
                return true; // indicate configuration changed
            } else {
                console.log(chalk.gray('\n👋 Goodbye!'));
                return false; // indicate no change
            }
        } catch (error) {
            console.error(chalk.red('\n❌ Error:'), error.message);
            if (error.message.includes('ENOENT')) {
                console.log(chalk.yellow('\nMake sure your shell config file exists at:'), error.message.match(/:(.+)$/)?.[1]);
            }
            throw error;
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

            // Reload is handled by shell wrapper after ccc exits successfully
        } catch (error) {
            console.error(chalk.red('\n❌ Failed to switch configuration:'), error.message);
        }
    }

    module.exports = InteractiveMenu;
