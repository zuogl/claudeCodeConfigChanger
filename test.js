const ConfigParser = require('./lib/config-parser');
const fs = require('fs').promises;
const path = require('path');

async function test() {
    // Create a test config file
    const testConfigPath = path.join(__dirname, 'test-config.txt');

    const testContent = `# 春秋中转
# export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"
# export ANTHROPIC_AUTH_TOKEN="xxx"

# 官方API
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-xxx"

# 测试服务器
# export ANTHROPIC_BASE_URL="https://test.example.com"
# export ANTHROPIC_AUTH_TOKEN="test-token"

# 其他配置
SOME_OTHER_VAR=value`;

    try {
        // Write test config
        await fs.writeFile(testConfigPath, testContent);
        console.log('✅ Test config file created');

        // Test parser
        const parser = new ConfigParser(testConfigPath);

        // Test getting available groups
        console.log('\n📋 Testing group detection:');
        const groups = await parser.getAvailableGroups();
        groups.forEach(group => {
            const status = group.isActive ? '(active)' : '(inactive)';
            console.log(`  - ${group.name} ${status}`);
        });

        // Test switching groups
        console.log('\n🔄 Testing group switch:');
        const targetGroup = '春秋中转';
        const switched = await parser.switchGroup(targetGroup);
        console.log(`✅ Switched to: ${switched.name}`);

        // Verify the switch
        const updatedContent = await fs.readFile(testConfigPath, 'utf8');
        console.log('\n📄 Updated config:');
        console.log(updatedContent);

        // Clean up
        await fs.unlink(testConfigPath);
        console.log('\n✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

if (require.main === module) {
    test();
}

module.exports = { test };