#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function getInstallPath() {
    // When installed globally via npm, __dirname points to the installed package
    return __dirname;
}

function detectShellConfig() {
    const shell = process.env.SHELL || '';
    const home = os.homedir();
    const shellName = path.basename(shell);

    switch (shellName) {
        case 'zsh':
            return path.join(home, '.zshrc');
        case 'bash':
            if (fs.existsSync(path.join(home, '.bashrc'))) {
                return path.join(home, '.bashrc');
            }
            return path.join(home, '.bash_profile');
        default:
            return path.join(home, '.profile');
    }
}

function main() {
    console.log('\n📦 Claude Config Changer installed successfully!');
    console.log('\n📝 To complete the setup, run the following command:');
    console.log('\n   npx ccc-setup\n');
    console.log('This will configure your shell to use the ccc and ccs commands.');
    console.log('\nAlternatively, you can manually add this to your shell config:');

    const installPath = getInstallPath();
    const shellConfig = detectShellConfig();

    console.log(`
# Claude Config Changer - shell wrapper for environment refresh
if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
    source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
fi
`);

    console.log(`Add the above to: ${shellConfig}\n`);
}

// Only run if this is a global installation
if (process.env.npm_config_global === 'true') {
    main();
}