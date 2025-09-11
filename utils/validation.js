/**
 * Validation Utilities
 * Provides input validation for phone numbers, messages, and other data
 */

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} Validation result with normalized number
 */
function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return {
            isValid: false,
            error: 'Phone number is required'
        };
    }
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.toString().replace(/\D/g, '');
    
    // Check minimum length (10 digits for most countries)
    if (cleaned.length < 10) {
        return {
            isValid: false,
            error: 'Phone number must be at least 10 digits'
        };
    }
    
    // Check maximum length (15 digits per E.164 standard)
    if (cleaned.length > 15) {
        return {
            isValid: false,
            error: 'Phone number must not exceed 15 digits'
        };
    }
    
    // Indian phone numbers (special handling)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        // Valid Indian number with country code
        return {
            isValid: true,
            normalized: cleaned,
            countryCode: '91',
            nationalNumber: cleaned.substring(2)
        };
    } else if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
        // Valid Indian number without country code
        return {
            isValid: true,
            normalized: '91' + cleaned,
            countryCode: '91',
            nationalNumber: cleaned
        };
    }
    
    // International format (must start with country code)
    if (cleaned.length >= 11) {
        return {
            isValid: true,
            normalized: cleaned,
            countryCode: null, // Could be extracted with a country code library
            nationalNumber: null
        };
    }
    
    return {
        isValid: false,
        error: 'Invalid phone number format'
    };
}

/**
 * Validate multiple phone numbers
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @returns {Object} Validation results
 */
function validatePhoneNumbers(phoneNumbers) {
    if (!Array.isArray(phoneNumbers)) {
        return {
            isValid: false,
            error: 'Phone numbers must be an array'
        };
    }
    
    const results = phoneNumbers.map(phone => ({
        original: phone,
        ...validatePhoneNumber(phone)
    }));
    
    const valid = results.filter(r => r.isValid);
    const invalid = results.filter(r => !r.isValid);
    
    return {
        isValid: invalid.length === 0,
        valid,
        invalid,
        totalValid: valid.length,
        totalInvalid: invalid.length
    };
}

/**
 * Validate WhatsApp message content
 * @param {Object} message - Message object
 * @returns {Object} Validation result
 */
function validateWhatsAppMessage(message) {
    const errors = [];
    
    if (!message) {
        return {
            isValid: false,
            errors: ['Message object is required']
        };
    }
    
    // Check message type
    const validTypes = ['text', 'image', 'document', 'template', 'interactive'];
    if (!message.type || !validTypes.includes(message.type)) {
        errors.push(`Invalid message type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Type-specific validation
    switch (message.type) {
        case 'text':
            if (!message.text || !message.text.body) {
                errors.push('Text message must have a body');
            } else if (message.text.body.length > 4096) {
                errors.push('Text message body must not exceed 4096 characters');
            }
            break;
            
        case 'image':
            if (!message.image) {
                errors.push('Image message must have image object');
            } else {
                if (!message.image.link && !message.image.id) {
                    errors.push('Image must have either a link or media ID');
                }
                if (message.image.caption && message.image.caption.length > 1024) {
                    errors.push('Image caption must not exceed 1024 characters');
                }
            }
            break;
            
        case 'template':
            if (!message.template || !message.template.name) {
                errors.push('Template message must have a template name');
            }
            if (message.template.name && !/^[a-z0-9_]+$/.test(message.template.name)) {
                errors.push('Template name must contain only lowercase letters, numbers, and underscores');
            }
            break;
            
        case 'interactive':
            if (!message.interactive) {
                errors.push('Interactive message must have interactive object');
            }
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate template parameters
 * @param {Array} parameters - Template parameters
 * @param {number} expectedCount - Expected number of parameters
 * @returns {Object} Validation result
 */
function validateTemplateParameters(parameters, expectedCount) {
    const errors = [];
    
    if (!Array.isArray(parameters)) {
        return {
            isValid: false,
            errors: ['Parameters must be an array']
        };
    }
    
    if (parameters.length !== expectedCount) {
        errors.push(`Expected ${expectedCount} parameters, got ${parameters.length}`);
    }
    
    // Check each parameter
    parameters.forEach((param, index) => {
        if (typeof param !== 'string' && typeof param !== 'number') {
            errors.push(`Parameter ${index + 1} must be a string or number`);
        }
        if (param === null || param === undefined) {
            errors.push(`Parameter ${index + 1} cannot be null or undefined`);
        }
        if (typeof param === 'string' && param.length === 0) {
            errors.push(`Parameter ${index + 1} cannot be empty`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized input
 */
function sanitizeInput(input, options = {}) {
    if (!input) return '';
    
    let sanitized = String(input);
    
    // Remove control characters
    if (options.removeControlChars !== false) {
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }
    
    // Escape HTML if needed
    if (options.escapeHtml) {
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
    
    // Trim whitespace
    if (options.trim !== false) {
        sanitized = sanitized.trim();
    }
    
    // Limit length
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
}

/**
 * Validate webhook payload
 * @param {Object} payload - Webhook payload
 * @returns {Object} Validation result
 */
function validateWebhookPayload(payload) {
    const errors = [];
    
    if (!payload) {
        return {
            isValid: false,
            errors: ['Payload is required']
        };
    }
    
    // Check for required fields based on webhook type
    if (payload.object === 'whatsapp_business_account') {
        if (!payload.entry || !Array.isArray(payload.entry)) {
            errors.push('WhatsApp webhook must have entry array');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {Object} Validation result
 */
function validateEmail(email) {
    if (!email) {
        return {
            isValid: false,
            error: 'Email is required'
        };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: 'Invalid email format'
        };
    }
    
    return {
        isValid: true,
        normalized: email.toLowerCase().trim()
    };
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
function validateUrl(url) {
    if (!url) {
        return {
            isValid: false,
            error: 'URL is required'
        };
    }
    
    try {
        const parsed = new URL(url);
        
        // Check for valid protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return {
                isValid: false,
                error: 'URL must use HTTP or HTTPS protocol'
            };
        }
        
        return {
            isValid: true,
            normalized: parsed.href,
            protocol: parsed.protocol,
            hostname: parsed.hostname
        };
    } catch (error) {
        return {
            isValid: false,
            error: 'Invalid URL format'
        };
    }
}

module.exports = {
    validatePhoneNumber,
    validatePhoneNumbers,
    validateWhatsAppMessage,
    validateTemplateParameters,
    sanitizeInput,
    validateWebhookPayload,
    validateEmail,
    validateUrl
};