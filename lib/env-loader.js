const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const ConfigValidator = require('./config-validator');

class EnvLoader {
    constructor(options = {}) {
        this.envPath = options.envPath || process.cwd();
        this.envFiles = options.envFiles || ['.env', '.env.local'];
        this.validator = options.validator || new ConfigValidator();
        this.loadedConfigs = new Map();
    }

    async loadEnvFile(filePath) {
        try {
            const absolutePath = path.resolve(filePath);
            const content = await fs.readFile(absolutePath, 'utf8');
            const parsed = dotenv.parse(content);

            this.loadedConfigs.set(absolutePath, {
                path: absolutePath,
                parsed,
                raw: content
            });

            return parsed;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async loadMultipleEnvFiles(files) {
        const configs = {};

        for (const file of files) {
            const filePath = path.join(this.envPath, file);
            const config = await this.loadEnvFile(filePath);

            if (config) {
                Object.assign(configs, config);
            }
        }

        return configs;
    }

    async loadEnvironment(options = {}) {
        const {
            override = false,
            validate = true,
            expand = true
        } = options;

        const envConfigs = await this.loadMultipleEnvFiles(this.envFiles);

        if (!override) {
            for (const key in envConfigs) {
                if (process.env[key] === undefined) {
                    process.env[key] = envConfigs[key];
                }
            }
        } else {
            Object.assign(process.env, envConfigs);
        }

        if (expand) {
            this.expandVariables();
        }

        if (validate) {
            const validation = this.validator.validate(envConfigs);
            if (!validation.isValid) {
                console.warn('Configuration validation warnings:', validation.errorMessage);
            }
            return validation;
        }

        return { isValid: true, value: envConfigs };
    }

    expandVariables() {
        for (const key in process.env) {
            const value = process.env[key];
            if (typeof value === 'string') {
                process.env[key] = this.interpolate(value, process.env);
            }
        }
    }

    interpolate(value, env) {
        return value.replace(/\$\{([^}]+)\}/g, (match, key) => {
            return env[key] || match;
        });
    }

    async saveEnvFile(config, filePath) {
        const targetPath = filePath || path.join(this.envPath, '.env');
        const lines = [];

        for (const [key, value] of Object.entries(config)) {
            const escapedValue = value.includes(' ') ? `"${value}"` : value;
            lines.push(`${key}=${escapedValue}`);
        }

        await fs.writeFile(targetPath, lines.join('\n'), 'utf8');
        return targetPath;
    }

    async mergeEnvFiles(sourceFiles, targetFile) {
        const merged = {};

        for (const file of sourceFiles) {
            const config = await this.loadEnvFile(file);
            if (config) {
                Object.assign(merged, config);
            }
        }

        await this.saveEnvFile(merged, targetFile);
        return merged;
    }

    getLoadedConfigs() {
        return Array.from(this.loadedConfigs.entries()).map(([path, config]) => ({
            path,
            variables: Object.keys(config.parsed),
            size: config.raw.length
        }));
    }

    async convertShellToEnv(shellConfigPath, envPath) {
        const content = await fs.readFile(shellConfigPath, 'utf8');
        const envVars = {};

        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^export\s+([A-Z_]+)=["']?([^"'\n]+)["']?/);
            if (match) {
                envVars[match[1]] = match[2];
            }
        }

        await this.saveEnvFile(envVars, envPath);
        return envVars;
    }

    async watchEnvFile(filePath, callback) {
        const absolutePath = path.resolve(filePath);
        let lastContent = '';

        try {
            lastContent = await fs.readFile(absolutePath, 'utf8');
        } catch (error) {
            console.error('Error reading env file:', error);
        }

        const checkFile = async () => {
            try {
                const currentContent = await fs.readFile(absolutePath, 'utf8');
                if (currentContent !== lastContent) {
                    lastContent = currentContent;
                    const parsed = dotenv.parse(currentContent);
                    callback(parsed, absolutePath);
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error('Error watching env file:', error);
                }
            }
        };

        const interval = setInterval(checkFile, 1000);

        return () => clearInterval(interval);
    }
}

module.exports = EnvLoader;