#!/bin/bash

# Claude Config Changer Local Installation Script
# This script is for local development and testing

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Installing Claude Config Changer (Local Development)..."

# 1. Install npm package globally from local directory
echo "📦 Installing npm package globally from local directory..."
npm install -g "$SCRIPT_DIR"

# 2. Run the setup script
echo ""
echo "🔧 Running shell setup..."
npx ccc-setup

echo ""
echo "💡 Note: This is a local development installation."
echo "   For production, users should run: npm install -g claude-config-changer"
