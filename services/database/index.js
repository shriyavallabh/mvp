/**
 * Database Service
 * Handles data persistence for contacts, campaigns, and sends
 * Uses JSON files for development, can be replaced with PostgreSQL for production
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

class DatabaseService {
    constructor() {
        this.dataPath = process.env.JSON_STORAGE_PATH || './data';
        this.files = {
            contacts: path.join(this.dataPath, 'contacts.json'),
            campaigns: path.join(this.dataPath, 'campaigns.json'),
            sends: path.join(this.dataPath, 'sends.json')
        };
        this.cache = {
            contacts: new Map(),
            campaigns: new Map(),
            sends: new Map()
        };
        this.initialized = false;
    }

    /**
     * Initialize database and load data
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataPath, { recursive: true });

            // Load existing data or create empty files
            for (const [key, filePath] of Object.entries(this.files)) {
                try {
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    
                    // Load into cache
                    if (Array.isArray(parsed)) {
                        parsed.forEach(item => {
                            this.cache[key].set(item.id || item.wa_id, item);
                        });
                    } else {
                        Object.entries(parsed).forEach(([id, item]) => {
                            this.cache[key].set(id, item);
                        });
                    }
                } catch (error) {
                    // File doesn't exist, create empty
                    await fs.writeFile(filePath, '[]', 'utf8');
                    logger.info(`Created new data file: ${filePath}`);
                }
            }

            this.initialized = true;
            logger.info('Database initialized');
        } catch (error) {
            logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Save cache to file
     */
    async persist(type) {
        try {
            const data = Array.from(this.cache[type].values());
            await fs.writeFile(this.files[type], JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            logger.error(`Failed to persist ${type}:`, error);
            throw error;
        }
    }

    // ============= CONTACTS =============

    /**
     * Get all opted-in contacts
     */
    async getOptedInContacts() {
        await this.initialize();
        return Array.from(this.cache.contacts.values())
            .filter(contact => contact.opt_in === true);
    }

    /**
     * Get contact by WhatsApp ID
     */
    async getContact(waId) {
        await this.initialize();
        return this.cache.contacts.get(waId);
    }

    /**
     * Create or update contact
     */
    async upsertContact(waId, data) {
        await this.initialize();
        
        const existing = this.cache.contacts.get(waId);
        const contact = {
            ...existing,
            ...data,
            wa_id: waId,
            updated_at: new Date().toISOString()
        };

        if (!existing) {
            contact.created_at = new Date().toISOString();
        }

        this.cache.contacts.set(waId, contact);
        await this.persist('contacts');
        
        return contact;
    }

    /**
     * Update contact
     */
    async updateContact(waId, updates) {
        return this.upsertContact(waId, updates);
    }

    /**
     * Bulk import contacts
     */
    async importContacts(contacts) {
        await this.initialize();
        
        for (const contact of contacts) {
            const waId = contact.wa_id || contact.phone;
            if (waId) {
                await this.upsertContact(waId, contact);
            }
        }

        logger.info(`Imported ${contacts.length} contacts`);
    }

    // ============= CAMPAIGNS =============

    /**
     * Create campaign
     */
    async createCampaign(data) {
        await this.initialize();
        
        const campaign = {
            ...data,
            id: `campaign_${Date.now()}`,
            status: 'planned',
            created_at: new Date().toISOString()
        };

        this.cache.campaigns.set(campaign.id, campaign);
        await this.persist('campaigns');
        
        return campaign;
    }

    /**
     * Get campaign
     */
    async getCampaign(campaignId) {
        await this.initialize();
        return this.cache.campaigns.get(campaignId);
    }

    /**
     * Update campaign status
     */
    async updateCampaignStatus(campaignId, status) {
        await this.initialize();
        
        const campaign = this.cache.campaigns.get(campaignId);
        if (campaign) {
            campaign.status = status;
            campaign.updated_at = new Date().toISOString();
            
            if (status === 'sending') {
                campaign.started_at = new Date().toISOString();
            } else if (status === 'done') {
                campaign.completed_at = new Date().toISOString();
            }

            await this.persist('campaigns');
        }
        
        return campaign;
    }

    /**
     * Get today's campaign
     */
    async getTodaysCampaign() {
        await this.initialize();
        
        const today = new Date().toISOString().split('T')[0];
        const campaigns = Array.from(this.cache.campaigns.values());
        
        return campaigns.find(c => c.date === today);
    }

    // ============= SENDS =============

    /**
     * Create send record
     */
    async createSend(data) {
        await this.initialize();
        
        const send = {
            ...data,
            id: `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString()
        };

        // Index by both ID and wamid
        this.cache.sends.set(send.id, send);
        if (send.wamid) {
            this.cache.sends.set(send.wamid, send);
        }

        await this.persist('sends');
        
        return send;
    }

    /**
     * Get send by WhatsApp Message ID
     */
    async getSendByWamid(wamid) {
        await this.initialize();
        return this.cache.sends.get(wamid);
    }

    /**
     * Update send status
     */
    async updateSendStatus(wamid, status, additionalData = {}) {
        await this.initialize();
        
        const send = this.cache.sends.get(wamid);
        if (send) {
            send.status = status;
            send.updated_at = new Date().toISOString();
            
            // Add any additional data (error codes, etc.)
            Object.assign(send, additionalData);
            
            await this.persist('sends');
        }
        
        return send;
    }

    /**
     * Update send record
     */
    async updateSend(wamid, updates) {
        await this.initialize();
        
        const send = this.cache.sends.get(wamid);
        if (send) {
            Object.assign(send, updates);
            send.updated_at = new Date().toISOString();
            await this.persist('sends');
        }
        
        return send;
    }

    /**
     * Get campaign statistics
     */
    async getCampaignStats(campaignId) {
        await this.initialize();
        
        const sends = Array.from(this.cache.sends.values())
            .filter(s => s.campaign_id === campaignId);

        const stats = {
            total: sends.length,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            timeout: 0,
            byChannel: {
                media_template: { sent: 0, delivered: 0, failed: 0 },
                text_template: { sent: 0, delivered: 0, failed: 0 }
            }
        };

        for (const send of sends) {
            switch (send.status) {
                case 'sent':
                    stats.sent++;
                    break;
                case 'delivered':
                    stats.delivered++;
                    break;
                case 'read':
                    stats.read++;
                    break;
                case 'failed':
                    stats.failed++;
                    break;
                case 'timeout':
                    stats.timeout++;
                    break;
            }

            if (send.channel && stats.byChannel[send.channel]) {
                if (send.status === 'delivered' || send.status === 'read') {
                    stats.byChannel[send.channel].delivered++;
                } else if (send.status === 'failed') {
                    stats.byChannel[send.channel].failed++;
                } else if (send.status === 'sent' || send.status === 'accepted') {
                    stats.byChannel[send.channel].sent++;
                }
            }
        }

        stats.deliveryRate = stats.total > 0 ? (stats.delivered + stats.read) / stats.total : 0;
        stats.failureRate = stats.total > 0 ? stats.failed / stats.total : 0;

        return stats;
    }

    /**
     * Clean up old sends (older than 30 days)
     */
    async cleanupOldSends() {
        await this.initialize();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let removed = 0;
        for (const [key, send] of this.cache.sends) {
            if (new Date(send.created_at) < thirtyDaysAgo) {
                this.cache.sends.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            await this.persist('sends');
            logger.info(`Cleaned up ${removed} old send records`);
        }
    }
}

module.exports = new DatabaseService();