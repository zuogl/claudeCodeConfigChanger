#!/usr/bin/env node

const { createClaudeWrapper } = require('../lib/claude-injector');

async function main() {
    // 获取传递给脚本的参数
    const args = process.argv.slice(2);

    // 创建 Claude Code 包装器
    const runClaude = await createClaudeWrapper();

    // 启动 Claude Code（带配置热重载）
    await runClaude(args);
}

main().catch(err => {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
});