#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { GoogleSheetsRateLimiter } = require('../utils/rate-limiter');

/**
 * AdvisorManager - Manages CRUD operations for advisor data in Google Sheets
 */
class AdvisorManager {
    constructor() {
        this.agentId = 'advisor-manager';
        this.state = 'IDLE';
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
        this.advisorsRange = 'Advisors!A:R';
        this.rateLimiter = new GoogleSheetsRateLimiter();
    }

    /**
     * Initializes the advisor manager with required dependencies
     * @returns {Promise<boolean>} True if initialization successful
     */
    async initialize() {
        try {
            this.state = 'PROCESSING';
            
            const Communication = require('../utils/communication');
            const ErrorHandler = require('../utils/error-handler');
            const Logger = require('../utils/logger');
            
            this.communication = new Communication();
            this.errorHandler = new ErrorHandler();
            this.logger = new Logger(this.agentId);
            
            await this.initializeGoogleSheets();
            
            this.logger.info('Advisor Manager initialized');
            this.state = 'IDLE';
            return true;
        } catch (error) {
            this.state = 'ERROR';
            console.error('Failed to initialize advisor manager:', error);
            return false;
        }
    }

    async initializeGoogleSheets() {
        try {
            const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
                                   path.join(process.cwd(), 'config', 'google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                this.logger.warn('Google credentials not found, using mock mode');
                this.mockMode = true;
                return;
            }
            
            const auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            
            this.sheets = google.sheets({ version: 'v4', auth });
            this.logger.info('Google Sheets API initialized');
        } catch (error) {
            this.logger.error('Failed to initialize Google Sheets', error);
            this.mockMode = true;
        }
    }

    /**
     * Gets active advisors from Google Sheets with rate limiting
     * @param {Object} filters - Filter criteria for advisors
     * @returns {Promise<Array>} Array of advisor objects
     */
    async getActiveAdvisors(filters = {}) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Fetching active advisors', { filters });
            
            if (this.mockMode) {
                return this.getMockAdvisors(filters);
            }
            
            // Use rate limiter for read operation
            const response = await this.rateLimiter.executeRead(async () => {
                return await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: this.advisorsRange
                });
            });
            
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                this.logger.warn('No advisors found');
                return [];
            }
            
            const headers = rows[0];
            const advisors = rows.slice(1).map(row => {
                const advisor = {};
                headers.forEach((header, index) => {
                    advisor[header] = row[index] || '';
                });
                return advisor;
            });
            
            let filteredAdvisors = advisors;
            
            if (filters.subscription_status) {
                filteredAdvisors = filteredAdvisors.filter(
                    a => a.subscription_status === filters.subscription_status
                );
            }
            
            if (filters.review_mode) {
                filteredAdvisors = filteredAdvisors.filter(
                    a => a.review_mode === filters.review_mode
                );
            }
            
            if (filters.auto_send !== undefined) {
                filteredAdvisors = filteredAdvisors.filter(
                    a => a.auto_send === filters.auto_send.toString()
                );
            }
            
            this.state = 'IDLE';
            this.logger.info(`Found ${filteredAdvisors.length} advisors matching filters`);
            return filteredAdvisors;
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to fetch advisors', error);
            throw error;
        }
    }

    getMockAdvisors(filters = {}) {
        const mockAdvisors = [
            {
                arn: 'ARN_12345',
                name: 'John Doe Financial Services',
                whatsapp: '+91-9876543210',
                email: 'john@example.com',
                logo_url: 'https://example.com/logo1.png',
                brand_colors: 'blue,gold',
                tone: 'professional',
                client_segment: 'young_professionals',
                ticket_size: 'medium',
                content_focus: 'growth',
                subscription_status: 'active',
                payment_mode: 'monthly',
                subscription_end_date: '2025-12-31',
                review_mode: 'manual',
                auto_send: 'false',
                override: ''
            },
            {
                arn: 'ARN_67890',
                name: 'Smart Wealth Advisors',
                whatsapp: '+91-9876543211',
                email: 'smart@example.com',
                logo_url: 'https://example.com/logo2.png',
                brand_colors: 'green,white',
                tone: 'friendly',
                client_segment: 'middle_aged',
                ticket_size: 'large',
                content_focus: 'balanced',
                subscription_status: 'active',
                payment_mode: 'annual',
                subscription_end_date: '2025-06-30',
                review_mode: 'auto',
                auto_send: 'true',
                override: ''
            },
            {
                arn: 'ARN_11111',
                name: 'Retirement Planning Experts',
                whatsapp: '+91-9876543212',
                email: 'retire@example.com',
                logo_url: 'https://example.com/logo3.png',
                brand_colors: 'navy,silver',
                tone: 'educational',
                client_segment: 'senior',
                ticket_size: 'ultra',
                content_focus: 'safety',
                subscription_status: 'trial',
                payment_mode: 'monthly',
                subscription_end_date: '2025-02-28',
                review_mode: 'manual',
                auto_send: 'false',
                override: ''
            }
        ];
        
        let filtered = mockAdvisors;
        
        if (filters.subscription_status) {
            filtered = filtered.filter(a => a.subscription_status === filters.subscription_status);
        }
        
        return filtered;
    }

    async createAdvisor(advisorData) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Creating new advisor', { arn: advisorData.arn });
            
            const validationResult = this.validateAdvisorData(advisorData);
            if (!validationResult.valid) {
                throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
            }
            
            if (this.mockMode) {
                this.logger.info('Mock mode: Advisor created', advisorData);
                this.state = 'IDLE';
                return { success: true, advisor: advisorData };
            }
            
            const values = this.advisorDataToRow(advisorData);
            
            // Use rate limiter for write operation
            await this.rateLimiter.executeWrite(async () => {
                return await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: this.advisorsRange,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [values]
                    }
                });
            });
            
            this.state = 'IDLE';
            this.logger.info('Advisor created successfully');
            return { success: true, advisor: advisorData };
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to create advisor', error);
            throw error;
        }
    }

    async updateAdvisor(arn, updates) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Updating advisor', { arn, updates });
            
            if (this.mockMode) {
                this.logger.info('Mock mode: Advisor updated', { arn, updates });
                this.state = 'IDLE';
                return { success: true, arn, updates };
            }
            
            const advisors = await this.getActiveAdvisors();
            const advisorIndex = advisors.findIndex(a => a.arn === arn);
            
            if (advisorIndex === -1) {
                throw new Error(`Advisor with ARN ${arn} not found`);
            }
            
            const updatedAdvisor = { ...advisors[advisorIndex], ...updates };
            const values = this.advisorDataToRow(updatedAdvisor);
            
            const rowNumber = advisorIndex + 2;
            const updateRange = `Advisors!A${rowNumber}:R${rowNumber}`;
            
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: updateRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [values]
                }
            });
            
            this.state = 'IDLE';
            this.logger.info('Advisor updated successfully');
            return { success: true, advisor: updatedAdvisor };
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to update advisor', error);
            throw error;
        }
    }

    async deleteAdvisor(arn) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Deleting advisor', { arn });
            
            if (this.mockMode) {
                this.logger.info('Mock mode: Advisor deleted', { arn });
                this.state = 'IDLE';
                return { success: true, arn };
            }
            
            const advisors = await this.getActiveAdvisors();
            const advisorIndex = advisors.findIndex(a => a.arn === arn);
            
            if (advisorIndex === -1) {
                throw new Error(`Advisor with ARN ${arn} not found`);
            }
            
            const rowNumber = advisorIndex + 2;
            const clearRange = `Advisors!A${rowNumber}:R${rowNumber}`;
            
            const response = await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: clearRange
            });
            
            this.state = 'IDLE';
            this.logger.info('Advisor deleted successfully');
            return { success: true, arn };
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to delete advisor', error);
            throw error;
        }
    }

    async bulkImport(advisorsData) {
        try {
            this.state = 'PROCESSING';
            this.logger.info(`Bulk importing ${advisorsData.length} advisors`);
            
            const results = [];
            for (const advisorData of advisorsData) {
                try {
                    const result = await this.createAdvisor(advisorData);
                    results.push({ success: true, arn: advisorData.arn });
                } catch (error) {
                    results.push({ success: false, arn: advisorData.arn, error: error.message });
                }
            }
            
            this.state = 'IDLE';
            const successCount = results.filter(r => r.success).length;
            this.logger.info(`Bulk import completed: ${successCount}/${advisorsData.length} successful`);
            
            return results;
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Bulk import failed', error);
            throw error;
        }
    }

    validateAdvisorData(data) {
        const errors = [];
        const requiredFields = ['arn', 'name', 'whatsapp', 'email'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }
        
        if (data.whatsapp && !this.isValidPhone(data.whatsapp)) {
            errors.push('Invalid WhatsApp number format');
        }
        
        const validTones = ['professional', 'friendly', 'educational'];
        if (data.tone && !validTones.includes(data.tone)) {
            errors.push(`Invalid tone. Must be one of: ${validTones.join(', ')}`);
        }
        
        const validSegments = ['young_professionals', 'middle_aged', 'senior', 'mixed'];
        if (data.client_segment && !validSegments.includes(data.client_segment)) {
            errors.push(`Invalid client segment. Must be one of: ${validSegments.join(', ')}`);
        }
        
        const validTicketSizes = ['small', 'medium', 'large', 'ultra'];
        if (data.ticket_size && !validTicketSizes.includes(data.ticket_size)) {
            errors.push(`Invalid ticket size. Must be one of: ${validTicketSizes.join(', ')}`);
        }
        
        const validContentFocus = ['growth', 'safety', 'tax', 'balanced'];
        if (data.content_focus && !validContentFocus.includes(data.content_focus)) {
            errors.push(`Invalid content focus. Must be one of: ${validContentFocus.join(', ')}`);
        }
        
        const validSubscriptionStatus = ['active', 'inactive', 'trial'];
        if (data.subscription_status && !validSubscriptionStatus.includes(data.subscription_status)) {
            errors.push(`Invalid subscription status. Must be one of: ${validSubscriptionStatus.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    advisorDataToRow(advisor) {
        return [
            advisor.arn || '',
            advisor.name || '',
            advisor.whatsapp || '',
            advisor.email || '',
            advisor.logo_url || '',
            advisor.brand_colors || '',
            advisor.tone || '',
            advisor.client_segment || '',
            advisor.ticket_size || '',
            advisor.content_focus || '',
            advisor.subscription_status || '',
            advisor.payment_mode || '',
            advisor.subscription_end_date || '',
            advisor.review_mode || '',
            advisor.auto_send || '',
            advisor.override || ''
        ];
    }

    async processMessage(message) {
        try {
            if (!this.communication || !this.communication.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            const { action, payload } = message;
            
            switch (action) {
                case 'GET_ACTIVE_ADVISORS':
                    const advisors = await this.getActiveAdvisors(payload.filters || {});
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'ADVISORS_RESPONSE',
                        payload: { advisors },
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'CREATE_ADVISOR':
                    const createResult = await this.createAdvisor(payload);
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'CREATE_RESPONSE',
                        payload: createResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'UPDATE_ADVISOR':
                    const updateResult = await this.updateAdvisor(payload.arn, payload.updates);
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'UPDATE_RESPONSE',
                        payload: updateResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'DELETE_ADVISOR':
                    const deleteResult = await this.deleteAdvisor(payload.arn);
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'DELETE_RESPONSE',
                        payload: deleteResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'BULK_IMPORT':
                    const bulkResult = await this.bulkImport(payload.advisors);
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'BULK_IMPORT_RESPONSE',
                        payload: { results: bulkResult },
                        context: message.context,
                        responseRequired: false
                    });
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Failed to process message', error);
            return this.communication.createMessage({
                agentId: this.agentId,
                action: 'ERROR_RESPONSE',
                payload: { error: error.message },
                context: message.context,
                responseRequired: false
            });
        }
    }

    /**
     * Get all active advisors from Google Sheets
     * @returns {Promise<Array>} Array of active advisor objects
     */
    async getAllActiveAdvisors() {
        try {
            await this.initialize();
            
            const response = await this.rateLimiter.executeRead(async () => {
                return await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: this.advisorsRange
                });
            });

            const rows = response.data.values || [];
            if (rows.length === 0) {
                this.logger.warn('No advisor data found in spreadsheet');
                return [];
            }

            // Skip header row
            const advisors = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length >= 3 && row[0] && row[1] && row[2]) { // Has ARN, Name, WhatsApp
                    const advisor = {
                        id: row[0], // ARN
                        arn: row[0],
                        name: row[1],
                        whatsapp: row[2],
                        email: row[3] || '',
                        logo_url: row[4] || '',
                        brand_colors: row[5] || '',
                        city: row[6] || '',
                        state: row[7] || '',
                        business_size: row[8] || '',
                        client_demographics: row[9] || '',
                        preferred_communication: row[10] || 'whatsapp',
                        content_preferences: row[11] || 'market_updates',
                        risk_profile: row[12] || 'moderate',
                        specialization: row[13] || 'general',
                        years_experience: parseInt(row[14]) || 0,
                        aum_range: row[15] || '',
                        commission_structure: row[16] || '',
                        status: row[17] || 'active'
                    };
                    
                    // Only include active advisors
                    if (advisor.status === 'active') {
                        advisors.push(advisor);
                    }
                }
            }

            this.logger.info(`Retrieved ${advisors.length} active advisors`);
            return advisors;

        } catch (error) {
            this.logger.error('Failed to get active advisors:', error);
            throw error;
        }
    }

    /**
     * Get advisor by ID/ARN
     * @param {string} advisorId - Advisor ARN or ID
     * @returns {Promise<Object|null>} Advisor object or null if not found
     */
    async getAdvisorById(advisorId) {
        try {
            const advisors = await this.getAllActiveAdvisors();
            return advisors.find(advisor => advisor.id === advisorId || advisor.arn === advisorId) || null;
        } catch (error) {
            this.logger.error(`Failed to get advisor ${advisorId}:`, error);
            throw error;
        }
    }

    async test() {
        console.log('=== Advisor Manager Test Mode ===');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize advisor manager');
            return;
        }
        
        console.log('Testing with sample advisor data...');
        
        const testAdvisor = {
            arn: 'ARN_TEST_001',
            name: 'Test Financial Advisor',
            whatsapp: '+91-9999999999',
            email: 'test@example.com',
            logo_url: 'https://example.com/test-logo.png',
            brand_colors: 'red,white',
            tone: 'professional',
            client_segment: 'young_professionals',
            ticket_size: 'medium',
            content_focus: 'growth',
            subscription_status: 'active',
            payment_mode: 'monthly',
            subscription_end_date: '2025-12-31',
            review_mode: 'manual',
            auto_send: 'false',
            override: ''
        };
        
        console.log('\n1. Testing data validation...');
        const validation = this.validateAdvisorData(testAdvisor);
        console.log(`Validation result: ${validation.valid ? 'PASSED' : 'FAILED'}`);
        if (!validation.valid) {
            console.log('Errors:', validation.errors);
        }
        
        console.log('\n2. Testing GET active advisors...');
        const advisors = await this.getActiveAdvisors({ subscription_status: 'active' });
        console.log(`Found ${advisors.length} active advisors`);
        
        console.log('\n3. Testing CREATE advisor (mock)...');
        const createResult = await this.createAdvisor(testAdvisor);
        console.log(`Create result: ${createResult.success ? 'SUCCESS' : 'FAILED'}`);
        
        console.log('\n=== Test Complete ===');
    }
}

if (require.main === module) {
    const manager = new AdvisorManager();
    
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        manager.test();
    } else {
        manager.initialize().then(() => {
            console.log('Advisor Manager running...');
        });
    }
}

module.exports = AdvisorManager;