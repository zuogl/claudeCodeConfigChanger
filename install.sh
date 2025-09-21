#!/bin/bash

# Claude Config Changer Installation Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NPM_BIN="$(npm bin -g 2>/dev/null || echo /usr/local/bin)"

echo "🚀 Installing Claude Config Changer..."

# 1. Install npm package globally
echo "📦 Installing npm package globally..."
npm install -g "$SCRIPT_DIR"

# 2. Detect shell configuration file
detect_shell_config() {
    local shell_name="$(basename "$SHELL")"
    local config_file=""

    case "$shell_name" in
        zsh)
            config_file="$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                config_file="$HOME/.bashrc"
            else
                config_file="$HOME/.bash_profile"
            fi
            ;;
        *)
            config_file="$HOME/.profile"
            ;;
    esac

    echo "$config_file"
}

SHELL_CONFIG="$(detect_shell_config)"

# 3. Add shell wrapper source command to config
echo "🔧 Setting up shell wrapper..."

WRAPPER_SOURCE="# Claude Config Changer - shell wrapper for environment refresh
# Set install dir for wrapper to find its components
export CCC_HOME=\"$SCRIPT_DIR\"
if [ -f \"$SCRIPT_DIR/shell-wrapper.sh\" ]; then
    source \"$SCRIPT_DIR/shell-wrapper.sh\"
fi"

# Check if already installed
if grep -q "Claude Config Changer - shell wrapper" "$SHELL_CONFIG" 2>/dev/null; then
    echo "⚠️  Shell wrapper already configured in $SHELL_CONFIG"
else
    echo "" >> "$SHELL_CONFIG"
    echo "$WRAPPER_SOURCE" >> "$SHELL_CONFIG"
    echo "✅ Added shell wrapper to $SHELL_CONFIG"
fi

echo ""
echo "✨ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your terminal or run: source $SHELL_CONFIG"
echo "   2. Run 'ccs' to launch Claude Code (hot reload)"
echo "   3. Run 'ccc' to switch configurations"
echo ""
echo "💡 The 'ccc' command will now refresh your current shell environment!"
echo "   Use 'ccs' to start Claude Code without clashing with system tools."
