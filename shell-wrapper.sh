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
                source ~/.bashrc 2>/dev/null
            elif [ -f ~/.bash_profile ]; then
                source ~/.bash_profile 2>/dev/null
            fi
        elif [ -n "$ZSH_VERSION" ]; then
            # Zsh
            if [ -f ~/.zshrc ]; then
                source ~/.zshrc 2>/dev/null
            elif [ -f ~/.zprofile ]; then
                source ~/.zprofile 2>/dev/null
            fi
        else
            # Generic shell
            if [ -f ~/.profile ]; then
                source ~/.profile 2>/dev/null
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

# Export the function so it's available in subshells
export -f ccc 2>/dev/null || true