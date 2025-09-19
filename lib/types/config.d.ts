export interface ClaudeConfig {
    ANTHROPIC_BASE_URL: string;
    ANTHROPIC_AUTH_TOKEN: string;
}

export interface AppConfig {
    NODE_ENV?: 'development' | 'production' | 'test';
    PORT?: number;
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
}

export interface DatabaseConfig {
    DB_HOST?: string;
    DB_PORT?: number;
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
}

export interface ConfigGroup {
    name: string;
    lines: string[];
    startLine: number;
    endLine: number;
    isActive?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    value?: any;
    errors: ValidationError[];
    errorMessage?: string;
}

export interface ValidationError {
    field: string;
    message: string;
    type: string;
}

export interface EnvLoaderOptions {
    envPath?: string;
    envFiles?: string[];
    validator?: any;
}

export interface LoadEnvironmentOptions {
    override?: boolean;
    validate?: boolean;
    expand?: boolean;
}

export interface LoadedConfig {
    path: string;
    variables: string[];
    size: number;
}

export interface ConfigParserOptions {
    configPath?: string;
}

export interface ConfigWatcherOptions {
    interval?: number;
    autoReload?: boolean;
}

export type ConfigSchema = 'claude' | 'app' | 'database' | string;

export interface SchemaField {
    type: string;
    required: boolean;
    validValues?: any[];
    default?: any;
}

export interface SchemaDescription {
    [key: string]: SchemaField;
}