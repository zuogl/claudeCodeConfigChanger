#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function isWindows() {
    return process.platform === 'win32';
}

function detectShellConfig() {
    const home = os.homedir();

    if (isWindows()) {
        // PowerShell profile locations
        const psProfiles = [
            path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
            path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
        ];

        for (const profile of psProfiles) {
            if (fs.existsSync(path.dirname(profile))) {
                return profile;
            }
        }

        // Default to the first one
        return psProfiles[0];
    }

    const shell = process.env.SHELL || '';
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

function getGlobalInstallPath() {
    try {
        const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        return path.join(npmRoot, 'claude-config-changer');
    } catch (e) {
        console.error('❌ Error: Could not find npm global installation path');
        process.exit(1);
    }
}

function setupShellWrapper() {
    const shellConfig = detectShellConfig();
    const installPath = getGlobalInstallPath();

    console.log('🚀 Setting up Claude Config Changer shell wrapper...');
    console.log(`📁 Package location: ${installPath}`);
    console.log(`📝 Config file: ${shellConfig}`);

    let wrapperSource;
    let wrapperFile;

    if (isWindows()) {
        // Windows PowerShell setup
        wrapperFile = 'shell-wrapper.ps1';
        const wrapperPath = path.join(installPath, wrapperFile);

        if (!fs.existsSync(wrapperPath)) {
            console.error(`❌ Error: ${wrapperFile} not found at ${wrapperPath}`);
            console.error('Please reinstall the package: npm install -g claude-config-changer');
            process.exit(1);
        }

        wrapperSource = `# Claude Config Changer - PowerShell wrapper for environment refresh
$global:CCC_HOME = "${installPath.replace(/\\/g, '\\\\')}"

# Source the wrapper functions
. "$global:CCC_HOME\\shell-wrapper.ps1"`;

    } else {
        // Unix-like systems setup
        wrapperFile = 'shell-wrapper.sh';
        const wrapperPath = path.join(installPath, wrapperFile);

        if (!fs.existsSync(wrapperPath)) {
            console.error(`❌ Error: ${wrapperFile} not found at ${wrapperPath}`);
            console.error('Please reinstall the package: npm install -g claude-config-changer');
            process.exit(1);
        }

        wrapperSource = `# Claude Config Changer - shell wrapper for environment refresh
# This enables hot-reload of environment variables and shell functions
if [ -f "$(npm root -g)/claude-config-changer/shell-wrapper.sh" ]; then
    source "$(npm root -g)/claude-config-changer/shell-wrapper.sh"
fi`;
    }

    // Check if already installed
    try {
        const configContent = fs.readFileSync(shellConfig, 'utf8');
        if (configContent.includes('Claude Config Changer')) {
            console.log('⚠️  Shell wrapper already configured in ' + shellConfig);
            console.log('\n💡 To update, remove the existing Claude Config Changer section from your config and run this again.');
            return;
        }
    } catch (e) {
        // File doesn't exist, will create it
        // Ensure directory exists
        const dir = path.dirname(shellConfig);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // Add to config
    try {
        fs.appendFileSync(shellConfig, '\n' + wrapperSource + '\n');
        console.log('✅ Shell wrapper added to ' + shellConfig);

        console.log('\n✨ Setup complete!');
        console.log('\n📝 Next steps:');

        if (isWindows()) {
            console.log('   1. Restart PowerShell or run: . $PROFILE');
            console.log('   2. Run \'ccs\' to launch Claude Code');
            console.log('   3. Run \'ccc\' to switch configurations');
        } else {
            console.log('   1. Restart your terminal or run: source ' + shellConfig);
            console.log('   2. Run \'ccs\' to launch Claude Code');
            console.log('   3. Run \'ccc\' to switch configurations');
        }

        console.log('\n💡 The \'ccc\' command will now refresh your current shell environment!');
    } catch (e) {
        console.error('❌ Error: Could not write to config file:', e.message);
        console.error('\nPlease manually add the following to your ' + shellConfig + ':');
        console.log('\n' + wrapperSource);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    setupShellWrapper();
}