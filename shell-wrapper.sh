#!/bin/bash

# Claude Config Changer Shell Wrapper
# This file should be sourced in your shell config

ccc() {
    # Save current environment
    local OLD_ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL"
    local OLD_ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

    # Run the actual ccc command
    command ccc "$@"

    # Check if the command was successful
    if [ $? -eq 0 ]; then
        # Reload the shell configuration to get new environment variables
        if [ -n "$BASH_VERSION" ]; then
            # Bash
            if [ -f ~/.bashrc ]; then
                source ~/.bashrc >/dev/null 2>&1
            elif [ -f ~/.bash_profile ]; then
                source ~/.bash_profile >/dev/null 2>&1
            fi
        elif [ -n "$ZSH_VERSION" ]; then
            # Zsh
            if [ -f ~/.zshrc ]; then
                source ~/.zshrc >/dev/null 2>&1
            elif [ -f ~/.zprofile ]; then
                source ~/.zprofile >/dev/null 2>&1
            fi
        else
            # Generic shell
            if [ -f ~/.profile ]; then
                source ~/.profile >/dev/null 2>&1
            fi
        fi

        # Check if environment actually changed
        if [ "$OLD_ANTHROPIC_BASE_URL" != "$ANTHROPIC_BASE_URL" ]; then
            echo ""
            echo "✅ Configuration reloaded in current shell!"
            echo "📍 New API URL: $ANTHROPIC_BASE_URL"
        fi
    fi
}

# Do not export the function; avoid zsh printing definitions on startup

# Resolve install dir for this project (works in bash/zsh)
_ccc_install_dir() {
    # Prefer explicit env if set by installer
    if [ -n "$CCC_HOME" ]; then
        echo "$CCC_HOME"
        return
    fi

    # Bash: BASH_SOURCE points to the sourced file
    if [ -n "$BASH_VERSION" ] && [ -n "${BASH_SOURCE[0]}" ]; then
        local src="${BASH_SOURCE[0]}"
        cd "$(dirname "$src")" && pwd
        return
    fi

    # Zsh: ${(%):-%N} expands to current script path
    if [ -n "$ZSH_VERSION" ]; then
        local src
        src="$(eval 'printf %s "${(%):-%N}"')"
        [ -n "$src" ] && { cd "$(dirname "$src")" && pwd; return; }
    fi

    # Fallback: current directory
    pwd
}

# ccs launcher: ccs [claude args] - Claude Code Starter
ccs() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: ccs [claude args]"
        echo "  ccs                - Start Claude with current config"
        echo "  ccs --help         - Show Claude help"
        return 0
    fi

    local DIR
    DIR="$(_ccc_install_dir)"

    # Run our Node launcher explicitly (no conflict with system tools)
    node "$DIR/bin/ccs.js" "$@"
}

# Do not export ccs to avoid leaking into subshell scripts unintentionally
