const inquirer = require('inquirer');
const chalk = require('chalk');
// No shell-level auto-refresh here; handled by outer wrapper

class InteractiveMenu {
    constructor(configParser) {
        this.configParser = configParser;
    }

    async showSelectionMenu() {
        try {
            console.log(chalk.cyan('\n🔧 Claude 配置切换器'));
            console.log(chalk.gray('选择要激活的配置:\n'));

            const groups = await this.configParser.getAvailableGroups();

            if (groups.length === 0) {
                console.log(chalk.red('❌ 配置文件中未找到 Claude 配置!'));
                console.log(chalk.yellow('\n请按以下格式添加配置:'));
                console.log(chalk.gray('# 配置名称'));
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
                    message: '选择 Claude 配置:',
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
                console.log(chalk.gray('\n👋 再见!'));
                return false; // indicate no change
            }
        } catch (error) {
            console.error(chalk.red('\n❌ 错误:'), error.message);
            if (error.message.includes('ENOENT')) {
                console.log(chalk.yellow('\n请确保 Shell 配置文件存在于:'), error.message.match(/:(.+)$/)?.[1]);
            }
            throw error;
        }
    }

    async switchToGroup(groupName) {
        console.log(chalk.yellow(`\n⏳ 正在切换到 "${groupName}"...`));

        try {
            const group = await this.configParser.switchGroup(groupName);

            console.log(chalk.green('\n✅ 配置更新成功!'));
            console.log(chalk.cyan(`\n📍 当前使用: ${group.name}`));

            // Extract the values from the group
            const baseUrlLine = group.lines.find(line =>
                line.trim().startsWith('export ANTHROPIC_BASE_URL=')
            );
            const tokenLine = group.lines.find(line =>
                line.trim().startsWith('export ANTHROPIC_AUTH_TOKEN=')
            );

            if (baseUrlLine) {
                const url = baseUrlLine.match(/"([^"]+)"/)?.[1];
                console.log(chalk.gray(`   Base URL: ${url || '未设置'}`));
            }
            if (tokenLine) {
                const token = tokenLine.match(/"([^"]+)"/)?.[1];
                const maskedToken = token ? `${token.substring(0, 8)}...` : '未设置';
                console.log(chalk.gray(`   Auth Token: ${maskedToken}`));
            }

            // Reload is handled by shell wrapper after ccc exits successfully
        } catch (error) {
            console.error(chalk.red('\n❌ 切换配置失败:'), error.message);
        }
    }
}

module.exports = InteractiveMenu;
