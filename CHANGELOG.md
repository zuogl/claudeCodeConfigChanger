# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-09-23

### Added
- New `ccc-setup` command for automatic shell configuration
- `postinstall` script that provides setup instructions after installation
- Automatic OS detection (Windows/Mac/Linux) in setup script
- Smart path detection for global npm installations
- PowerShell profile auto-creation if it doesn't exist
- Clear setup instructions shown after npm install

### Changed
- Simplified installation process - now just 3 steps
- Improved Windows PowerShell support with dynamic path resolution
- Enhanced shell wrapper to use `CCC_HOME` environment variable
- Updated README with clearer, more beginner-friendly instructions
- Reorganized documentation structure for better readability

### Fixed
- Global installation path issues on all platforms
- `ccs` command not working in different directories
- PowerShell wrapper now correctly finds global installation
- Shell wrapper functions now properly resolve installation directory

### Technical Improvements
- Added `isWindows()` helper function for cross-platform compatibility
- Improved error handling in setup script
- Better fallback mechanisms for finding installation paths
- Cleaner separation between development and production installation

## [2.0.2] - 2024-09-21

### Fixed
- Windows line ending issues (CRLF to LF conversion)
- Cross-platform compatibility improvements
- Shell configuration file permission handling

### Changed
- Updated installation scripts for better reliability
- Improved error messages and user feedback

## [2.0.1] - 2024-09-20

### Added
- Initial public release
- Basic configuration switching functionality
- Shell wrapper for environment variable hot-reload
- Support for multiple Claude API configurations

### Features
- Interactive configuration menu with `ccc` command
- Claude Code launcher with `ccs` command
- Automatic environment variable management
- Cross-platform support (Windows, macOS, Linux)