/**
 * Environment Variable Validator
 * Validates all required environment variables on application startup
 */

const Logger = require('./logger');
const logger = new Logger('env-validator');

class EnvironmentValidator {
  constructor() {
    // Define all required environment variables with descriptions
    this.requiredVars = {
      // Claude CLI
      CLAUDE_SESSION_TOKEN: {
        description: 'Claude CLI session token for content generation',
        sensitive: true
      },
      
      // Gemini API
      GEMINI_API_KEY: {
        description: 'Gemini API key for image generation',
        sensitive: true
      },
      
      // WhatsApp Business API
      WHATSAPP_PHONE_NUMBER_ID: {
        description: 'WhatsApp Business phone number ID',
        sensitive: false
      },
      WHATSAPP_BUSINESS_ACCOUNT_ID: {
        description: 'WhatsApp Business account ID',
        sensitive: false
      },
      WHATSAPP_ACCESS_TOKEN: {
        description: 'WhatsApp Business access token',
        sensitive: true
      },
      
      // Google Drive
      GOOGLE_DRIVE_CLIENT_ID: {
        description: 'Google Drive OAuth client ID',
        sensitive: false
      },
      GOOGLE_DRIVE_CLIENT_SECRET: {
        description: 'Google Drive OAuth client secret',
        sensitive: true
      },
      GOOGLE_DRIVE_REFRESH_TOKEN: {
        description: 'Google Drive OAuth refresh token',
        sensitive: true
      },
      GOOGLE_DRIVE_ROOT_FOLDER_ID: {
        description: 'Google Drive root folder ID',
        sensitive: false
      },
      
      // Google Sheets
      GOOGLE_SHEETS_ID: {
        description: 'Google Sheets ID for advisor data',
        sensitive: false
      },
      
      // Email Settings
      SMTP_HOST: {
        description: 'SMTP host for email notifications',
        sensitive: false
      },
      SMTP_PORT: {
        description: 'SMTP port for email notifications',
        sensitive: false
      },
      SMTP_USER: {
        description: 'SMTP username for email notifications',
        sensitive: false
      },
      SMTP_PASS: {
        description: 'SMTP password/app password for email notifications',
        sensitive: true
      },
      
      // Admin Settings
      ADMIN_WHATSAPP_NUMBERS: {
        description: 'Comma-separated list of admin WhatsApp numbers',
        sensitive: false
      },
      
      // Webhook Security
      WEBHOOK_SECRET: {
        description: 'Secret key for webhook authentication',
        sensitive: true
      }
    };
    
    // Optional environment variables with defaults
    this.optionalVars = {
      NODE_ENV: 'production',
      WEBHOOK_PORT: '5001',
      LOG_LEVEL: 'info'
    };
  }

  /**
   * Validate all required environment variables
   * @returns {Object} Validation result with success flag and any missing variables
   */
  validate() {
    const missing = [];
    const invalid = [];
    const warnings = [];

    // Check required variables
    for (const [varName, config] of Object.entries(this.requiredVars)) {
      const value = process.env[varName];
      
      if (!value) {
        missing.push({
          name: varName,
          description: config.description,
          sensitive: config.sensitive
        });
        continue;
      }
      
      // Additional validation for specific variables
      const validation = this.validateSpecificVar(varName, value);
      if (!validation.valid) {
        invalid.push({
          name: varName,
          error: validation.error,
          description: config.description
        });
      }
      
      if (validation.warning) {
        warnings.push({
          name: varName,
          warning: validation.warning
        });
      }
    }

    // Check for insecure default values
    this.checkForInsecureDefaults(warnings);

    // Set defaults for optional variables
    this.setDefaults();

    const success = missing.length === 0 && invalid.length === 0;

    return {
      success,
      missing,
      invalid,
      warnings,
      summary: this.generateSummary(success, missing, invalid, warnings)
    };
  }

  /**
   * Validate specific environment variables
   */
  validateSpecificVar(varName, value) {
    const result = { valid: true };

    switch (varName) {
      case 'CLAUDE_SESSION_TOKEN':
        if (value.length < 10) {
          result.valid = false;
          result.error = 'Claude session token appears to be too short';
        }
        break;
        
      case 'GEMINI_API_KEY':
        if (!value.startsWith('AIza')) {
          result.valid = false;
          result.error = 'Gemini API key should start with "AIza"';
        }
        break;
        
      case 'WHATSAPP_ACCESS_TOKEN':
        if (value.length < 50) {
          result.valid = false;
          result.error = 'WhatsApp access token appears to be too short';
        }
        break;
        
      case 'SMTP_PORT':
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          result.valid = false;
          result.error = 'SMTP port must be a valid port number (1-65535)';
        }
        break;
        
      case 'SMTP_USER':
        if (!value.includes('@')) {
          result.valid = false;
          result.error = 'SMTP user should be a valid email address';
        }
        break;
        
      case 'ADMIN_WHATSAPP_NUMBERS':
        const numbers = value.split(',');
        for (const number of numbers) {
          if (!number.trim().match(/^\+[1-9]\d{1,14}$/)) {
            result.valid = false;
            result.error = 'Admin WhatsApp numbers must be in international format (+1234567890)';
            break;
          }
        }
        break;
        
      case 'WEBHOOK_SECRET':
        if (value.length < 20) {
          result.warning = 'Webhook secret should be at least 20 characters for security';
        }
        if (value.includes('default') || value.includes('change') || value.includes('secret_key')) {
          result.valid = false;
          result.error = 'Webhook secret appears to be a default value - please set a secure secret';
        }
        break;
    }

    return result;
  }

  /**
   * Check for insecure default values in environment variables
   */
  checkForInsecureDefaults(warnings) {
    const insecurePatterns = [
      'default',
      'change_me',
      'change_this',
      'secret_key',
      'test_token',
      'placeholder'
    ];

    for (const [varName, config] of Object.entries(this.requiredVars)) {
      if (!config.sensitive) continue;
      
      const value = process.env[varName];
      if (!value) continue;
      
      const lowerValue = value.toLowerCase();
      for (const pattern of insecurePatterns) {
        if (lowerValue.includes(pattern)) {
          warnings.push({
            name: varName,
            warning: `Contains potentially insecure default value pattern: "${pattern}"`
          });
          break;
        }
      }
    }
  }

  /**
   * Set default values for optional environment variables
   */
  setDefaults() {
    for (const [varName, defaultValue] of Object.entries(this.optionalVars)) {
      if (!process.env[varName]) {
        process.env[varName] = defaultValue;
        logger.info(`[env-validator] Set default value for ${varName}: ${defaultValue}`);
      }
    }
  }

  /**
   * Generate a summary of validation results
   */
  generateSummary(success, missing, invalid, warnings) {
    let summary = '';
    
    if (success) {
      summary = '✅ All required environment variables are valid';
    } else {
      summary = '❌ Environment validation failed';
    }
    
    if (missing.length > 0) {
      summary += `\n\nMissing variables (${missing.length}):`;
      missing.forEach(item => {
        const mask = item.sensitive ? '[SENSITIVE]' : '';
        summary += `\n  • ${item.name} ${mask} - ${item.description}`;
      });
    }
    
    if (invalid.length > 0) {
      summary += `\n\nInvalid variables (${invalid.length}):`;
      invalid.forEach(item => {
        summary += `\n  • ${item.name} - ${item.error}`;
      });
    }
    
    if (warnings.length > 0) {
      summary += `\n\nWarnings (${warnings.length}):`;
      warnings.forEach(item => {
        summary += `\n  ⚠️  ${item.name} - ${item.warning}`;
      });
    }
    
    return summary;
  }

  /**
   * Log validation results
   */
  logResults(results) {
    if (results.success) {
      logger.info('[env-validator] Environment validation successful');
      if (results.warnings.length > 0) {
        logger.warn(`[env-validator] Found ${results.warnings.length} warnings`);
      }
    } else {
      logger.error('[env-validator] Environment validation failed');
      logger.error(results.summary);
    }
  }

  /**
   * Validate environment and exit if critical errors
   */
  validateAndExit() {
    const results = this.validate();
    this.logResults(results);
    
    if (!results.success) {
      console.error('\n' + results.summary);
      console.error('\n💡 Please check your .env file and set all required environment variables.');
      console.error('   Refer to .env.example for the complete list of required variables.\n');
      process.exit(1);
    }
    
    return results;
  }
}

// Export singleton instance
module.exports = new EnvironmentValidator();

// Also export class for testing
module.exports.EnvironmentValidator = EnvironmentValidator;