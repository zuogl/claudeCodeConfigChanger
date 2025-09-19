const ConfigParser = require('../lib/config-parser');
const ConfigValidator = require('../lib/config-validator');
const EnvLoader = require('../lib/env-loader');
const fs = require('fs').promises;
const path = require('path');

async function testConfigValidator() {
    console.log('\n=== Testing Config Validator ===\n');

    const validator = new ConfigValidator('claude');

    const testCases = [
        {
            name: 'Valid Claude config',
            config: {
                ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
                ANTHROPIC_AUTH_TOKEN: 'sk-ant-api-test-token-123456789'
            },
            expected: true
        },
        {
            name: 'Invalid URL format',
            config: {
                ANTHROPIC_BASE_URL: 'not-a-url',
                ANTHROPIC_AUTH_TOKEN: 'sk-ant-api-test-token-123456789'
            },
            expected: false
        },
        {
            name: 'Missing required field',
            config: {
                ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
            },
            expected: false
        },
        {
            name: 'Short token',
            config: {
                ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
                ANTHROPIC_AUTH_TOKEN: 'short'
            },
            expected: false
        }
    ];

    for (const testCase of testCases) {
        const result = validator.validate(testCase.config);
        const status = result.isValid === testCase.expected ? '✓' : '✗';
        console.log(`${status} ${testCase.name}`);
        if (!result.isValid && testCase.expected) {
            console.log(`  Error: ${result.errorMessage}`);
        }
    }

    console.log('\nRequired fields:', validator.getRequiredFields());
    console.log('Schema description:', JSON.stringify(validator.getSchemaDescription(), null, 2));
}

async function testEnvLoader() {
    console.log('\n=== Testing Env Loader ===\n');

    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const envContent = `
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=sk-ant-api-test-token-123456789
NODE_ENV=development
PORT=3000
`;

    const envLocalContent = `
ANTHROPIC_BASE_URL=https://api-local.anthropic.com
LOG_LEVEL=debug
`;

    await fs.writeFile(path.join(tempDir, '.env'), envContent);
    await fs.writeFile(path.join(tempDir, '.env.local'), envLocalContent);

    const loader = new EnvLoader({
        envPath: tempDir,
        envFiles: ['.env', '.env.local']
    });

    const result = await loader.loadEnvironment({ override: true });
    console.log('Loaded configs:', loader.getLoadedConfigs());
    console.log('Validation result:', result.isValid ? 'Valid' : 'Invalid');
    console.log('Final config:', result.value);

    await fs.rm(tempDir, { recursive: true, force: true });
}

async function testConfigFileValidation() {
    console.log('\n=== Testing Config File Validation ===\n');

    const validator = new ConfigValidator();

    const bashrcContent = `
# Claude API Configuration
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api-test-token-123456789"

# Some other exports
export PATH="/usr/local/bin:$PATH"
`;

    const result = validator.validateConfigFile(bashrcContent);
    console.log('Extracted vars:', validator.extractEnvVars(bashrcContent));
    console.log('Validation result:', result.isValid ? 'Valid' : result.errorMessage);
}

async function testShellToEnvConversion() {
    console.log('\n=== Testing Shell to Env Conversion ===\n');

    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const shellContent = `
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api-test-token-123456789"
export NODE_ENV=production
export PORT=8080
`;

    const shellPath = path.join(tempDir, 'shell.config');
    const envPath = path.join(tempDir, '.env.converted');

    await fs.writeFile(shellPath, shellContent);

    const loader = new EnvLoader();
    const converted = await loader.convertShellToEnv(shellPath, envPath);

    console.log('Converted variables:', converted);

    const envContent = await fs.readFile(envPath, 'utf8');
    console.log('\nGenerated .env file:');
    console.log(envContent);

    await fs.rm(tempDir, { recursive: true, force: true });
}

async function runAllTests() {
    try {
        await testConfigValidator();
        await testEnvLoader();
        await testConfigFileValidation();
        await testShellToEnvConversion();

        console.log('\n=== All Tests Completed ===\n');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = {
    testConfigValidator,
    testEnvLoader,
    testConfigFileValidation,
    testShellToEnvConversion
};