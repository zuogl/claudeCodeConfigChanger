const Joi = require('joi');

const configSchemas = {
    claude: Joi.object({
        ANTHROPIC_BASE_URL: Joi.string().uri().required(),
        ANTHROPIC_AUTH_TOKEN: Joi.string().min(10).required()
    }),

    app: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().port().default(3000),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
    }),

    database: Joi.object({
        DB_HOST: Joi.string().hostname(),
        DB_PORT: Joi.number().port(),
        DB_NAME: Joi.string(),
        DB_USER: Joi.string(),
        DB_PASSWORD: Joi.string()
    })
};

class ConfigValidator {
    constructor(schemaName = 'claude') {
        this.schema = configSchemas[schemaName] || configSchemas.claude;
        this.customSchemas = {};
    }

    addCustomSchema(name, schema) {
        this.customSchemas[name] = schema;
    }

    validate(config, options = {}) {
        const { error, value } = this.schema.validate(config, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true,
            ...options
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            return {
                isValid: false,
                errors,
                errorMessage: errors.map(e => `${e.field}: ${e.message}`).join(', ')
            };
        }

        return {
            isValid: true,
            value,
            errors: []
        };
    }

    validateEnvVars(envVars, schemaName) {
        const schema = this.customSchemas[schemaName] || configSchemas[schemaName] || this.schema;

        if (!schema) {
            throw new Error(`Schema "${schemaName}" not found`);
        }

        return this.validate(envVars);
    }

    extractEnvVars(content, prefix = 'ANTHROPIC_') {
        const lines = content.split('\n');
        const envVars = {};

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('export ') && !trimmedLine.startsWith('#')) {
                const match = trimmedLine.match(/export\s+([A-Z_]+)=["']?([^"'\s]+)["']?/);

                if (match && match[1].startsWith(prefix)) {
                    envVars[match[1]] = match[2];
                }
            }
        }

        return envVars;
    }

    validateConfigFile(content, prefix = 'ANTHROPIC_') {
        const envVars = this.extractEnvVars(content, prefix);
        return this.validate(envVars);
    }

    getRequiredFields() {
        const required = [];

        if (this.schema && this.schema._ids && this.schema._ids._byKey) {
            this.schema._ids._byKey.forEach((value, key) => {
                if (value.schema._flags && value.schema._flags.presence === 'required') {
                    required.push(key);
                }
            });
        }

        return required;
    }

    getSchemaDescription() {
        const description = {};

        if (this.schema && this.schema._ids && this.schema._ids._byKey) {
            this.schema._ids._byKey.forEach((value, key) => {
                const field = {
                    type: value.schema.type,
                    required: value.schema._flags?.presence === 'required'
                };

                if (value.schema._valids && value.schema._valids._values) {
                    field.validValues = Array.from(value.schema._valids._values);
                }

                if (value.schema._flags?.default) {
                    field.default = value.schema._flags.default;
                }

                description[key] = field;
            });
        }

        return description;
    }
}

module.exports = ConfigValidator;