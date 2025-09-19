const fs = require('fs').promises;
const path = require('path');

class ConfigParser {
    constructor(configPath) {
        this.configPath = configPath || path.join(process.env.HOME, '.bashrc');
    }

    async readConfig() {
        try {
            const content = await fs.readFile(this.configPath, 'utf8');
            return content;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Config file not found: ${this.configPath}`);
            }
            throw error;
        }
    }

    async writeConfig(content) {
        await fs.writeFile(this.configPath, content, 'utf8');
    }

    parseConfigGroups(content) {
        const lines = content.split('\n');
        const groups = [];
        let currentGroup = null;

        // First pass: find all lines with ANTHROPIC_ variables
        const anthropicLines = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('ANTHROPIC_BASE_URL') || lines[i].includes('ANTHROPIC_AUTH_TOKEN')) {
                anthropicLines.push(i);
            }
        }

        // If no ANTHROPIC_ lines found, return empty groups
        if (anthropicLines.length === 0) {
            return groups;
        }

        // Find group names by looking backwards from ANTHROPIC_ lines
        for (let lineNum of anthropicLines) {
            // Look backwards for a potential group name
            let groupLine = -1;
            for (let i = lineNum - 1; i >= Math.max(0, lineNum - 10); i--) {
                const trimmedLine = lines[i].trim();
                // A group name is a comment line that doesn't contain ANTHROPIC_ or export
                if (trimmedLine.startsWith('#') &&
                    !trimmedLine.includes('ANTHROPIC_') &&
                    !trimmedLine.includes('export') &&
                    trimmedLine.length > 1) {
                    // Check if this looks like a configuration group name
                    const groupName = trimmedLine.substring(1).trim();
                    if (groupName && !groupName.includes('=') && !groupName.includes('"')) {
                        groupLine = i;
                        break;
                    }
                } else if (trimmedLine && !trimmedLine.startsWith('#')) {
                    // Hit a non-comment line, stop looking
                    break;
                }
            }

            // If we found a group line and it's not already in a group
            if (groupLine !== -1) {
                let existingGroup = groups.find(g => g.startLine <= groupLine && g.endLine >= groupLine);
                if (!existingGroup) {
                    // Find the extent of this group
                    let startLine = groupLine;
                    let endLine = lineNum;

                    // Look for consecutive related lines after
                    for (let i = lineNum + 1; i < Math.min(lines.length, lineNum + 5); i++) {
                        const trimmedLine = lines[i].trim();
                        if (trimmedLine === '' ||
                            trimmedLine.includes('ANTHROPIC_') ||
                            trimmedLine.startsWith('# export')) {
                            endLine = i;
                        } else {
                            break;
                        }
                    }

                    groups.push({
                        name: lines[groupLine].substring(1).trim(),
                        lines: lines.slice(startLine, endLine + 1),
                        startLine: startLine,
                        endLine: endLine
                    });
                }
            }
        }

        return groups;
    }

    async switchGroup(groupName) {
        const content = await this.readConfig();
        const groups = this.parseConfigGroups(content);

        const targetGroup = groups.find(g => g.name === groupName);
        if (!targetGroup) {
            throw new Error(`Group "${groupName}" not found`);
        }

        const lines = content.split('\n');

        // First, comment out all ANTHROPIC_ exports
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('ANTHROPIC_BASE_URL') || line.includes('ANTHROPIC_AUTH_TOKEN')) {
                if (!line.trim().startsWith('#') && line.trim().startsWith('export')) {
                    lines[i] = '# ' + line;
                }
            }
        }

        // Then, uncomment the target group's exports
        for (let lineNum = targetGroup.startLine; lineNum <= targetGroup.endLine; lineNum++) {
            const line = lines[lineNum];
            if (line.trim().startsWith('# export') &&
                (line.includes('ANTHROPIC_BASE_URL') || line.includes('ANTHROPIC_AUTH_TOKEN'))) {
                // Remove the comment and any extra space
                lines[lineNum] = line.replace(/^#\s*export/, 'export');
            }
        }

        const newContent = lines.join('\n');
        await this.writeConfig(newContent);

        return targetGroup;
    }

    async getAvailableGroups() {
        const content = await this.readConfig();
        const groups = this.parseConfigGroups(content);

        return groups.map(group => {
            const hasActiveConfig = group.lines.some(line =>
                line.trim().startsWith('export') &&
                (line.includes('ANTHROPIC_BASE_URL') || line.includes('ANTHROPIC_AUTH_TOKEN'))
            );
            return {
                name: group.name,
                isActive: hasActiveConfig
            };
        });
    }
}

module.exports = ConfigParser;