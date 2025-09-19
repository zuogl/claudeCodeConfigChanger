#!/usr/bin/env node

const ConfigParser = require('./lib/config-parser');

async function demo() {
    console.log('🔧 Claude Config Changer Demo\n');

    const parser = new ConfigParser(process.env.HOME + '/.bashrc');

    try {
        // Get all available configurations
        const groups = await parser.getAvailableGroups();
        console.log('📋 Available configurations:');
        groups.forEach(group => {
            const status = group.isActive ? '✅' : '⚪';
            console.log(`   ${status} ${group.name}`);
        });

        // Find which one is currently active
        const activeGroup = groups.find(g => g.isActive);
        if (activeGroup) {
            console.log(`\n🎯 Currently active: ${activeGroup.name}`);
        }

        console.log('\n💡 To test the interactive menu, run: ccc');
        console.log('💡 Or test a specific switch:');

        // Example: Switch to 春秋中转
        console.log('\n🔄 Testing switch to "春秋中转"...');
        const switched = await parser.switchGroup('春秋中转');
        console.log(`✅ Switched to: ${switched.name}`);

        // Verify the switch
        const content = await parser.readConfig();
        const activeLine = content.split('\n').find(line =>
            line.trim().startsWith('export ANTHROPIC_BASE_URL') && !line.trim().startsWith('#')
        );
        console.log(`📍 New active URL: ${activeLine.match(/"([^"]+)"/)?.[1]}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

demo();