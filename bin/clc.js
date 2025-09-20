#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

function printHelp() {
  console.log(`
clc - Claude Code launcher with hot reload

Usage:
  clc [claude args]        Start Claude Code (hot-reload config)
  clc --help               Show this help

Examples:
  clc                      # same as running 'claude' with hot reload
  clc --version            # pass args to underlying 'claude'
`);
}

function main() {
  let argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    return printHelp();
  }

  // Back-compat: if first arg is 'start', drop it to mimic original 'claude'
  if (argv.length > 0 && argv[0] === 'start') {
    argv = argv.slice(1);
  }

  // Back-compat: if someone passes 'claude' explicitly, drop it
  if (argv.length > 0 && argv[0] === 'claude') {
    argv = argv.slice(1);
  }

  const proxyScript = path.join(__dirname, '..', 'lib', 'claude-proxy.js');

  const child = spawn('node', [proxyScript, ...argv], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => process.exit(code));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main();
