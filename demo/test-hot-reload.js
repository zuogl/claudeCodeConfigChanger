#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const home = os.homedir();
const configPath = path.join(home, '.bashrc');

async function setupTestConfigs() {
    console.log('📝 设置测试配置...\n');

    // 备份现有配置
    const backupPath = path.join(home, '.bashrc.backup.' + Date.now());
    try {
        const configContent = await fs.readFile(configPath, 'utf8');
        await fs.writeFile(backupPath, configContent);
        console.log(`✅ 原配置已备份到: ${backupPath}`);
    } catch (err) {
        // 文件不存在，继续
    }

    // 创建测试配置
    const testConfigs = `
# Claude Config Test - Config 1
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test1-abc123"

# Claude Config Test - Config 2
# export ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test2-def456"

# [ACTIVE] Claude Config Test - Config 3
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test3-ghi789"
`;

    await fs.writeFile(configPath, testConfigs);
    console.log('✅ 测试配置已创建');
}

async function startDemo() {
    console.log('\n🎬 开始演示 Claude Code 配置热重载功能\n');

    // 创建模拟的 Claude Code 进程
    const mockClaude = spawn('node', [
        path.join(__dirname, '../lib/claude-config-hot-reload.js')
    ], {
        stdio: ['pipe', 'pipe', 'inherit']
    });

    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n=== 模拟场景 1: 通过 ccc 切换配置 ===\n');

    // 使用 ccc 切换到配置 2
    console.log('🔄 执行: ccc --config ~/.bashrc');
    const ccc = spawn('node', [
        path.join(__dirname, '../bin/ccc.js'),
        '--config', configPath
    ], {
        stdio: ['pipe', 'pipe', 'inherit']
    });

    // 模拟选择配置 2
    setTimeout(() => {
        ccc.stdin.write('\x1B[B'); // 向下移动
        ccc.stdin.write('\r');    // 回车选择
    }, 1000);

    await new Promise(resolve => {
        ccc.on('exit', resolve);
    });

    console.log('\n=== 模拟场景 2: 直接修改配置文件 ===\n');

    // 等待一下让用户看到效果
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 直接修改配置文件
    console.log('📝 直接修改配置文件...');
    const newConfig = `
# Claude Config Test - Config 1
# export ANTHROPIC_BASE_URL="https://api.anthropic.com"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test1-abc123"

# Claude Config Test - Config 2
# export ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"
# export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test2-def456"

# [ACTIVE] Claude Config Test - Direct Edit
export ANTHROPIC_BASE_URL="https://custom.api.example.com"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-direct-edit-jkl012"
`;

    await fs.writeFile(configPath, newConfig);
    console.log('✅ 配置文件已直接修改');

    // 等待查看效果
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🎉 演示完成！');
    console.log('\n💡 实际使用方法:');
    console.log('   1. 在一个终端运行: claude-hot-reload [args]');
    console.log('   2. 在另一个终端使用 ccc 切换配置');
    console.log('   3. 观察第一个终端的配置自动更新\n');

    // 清理
    mockClaude.kill();
    process.exit(0);
}

async function restoreConfig() {
    // 恢复原始配置
    const files = await fs.readdir(home);
    const backups = files.filter(f => f.startsWith('.bashrc.backup.'));

    if (backups.length > 0) {
        const latestBackup = backups.sort().pop();
        const backupPath = path.join(home, latestBackup);
        const content = await fs.readFile(backupPath, 'utf8');
        await fs.writeFile(configPath, content);
        await fs.unlink(backupPath);
        console.log('✅ 原始配置已恢复');
    }
}

// 主函数
(async () => {
    try {
        await setupTestConfigs();
        await startDemo();
    } catch (err) {
        console.error('❌ 演示出错:', err.message);
    } finally {
        await restoreConfig();
    }
})();