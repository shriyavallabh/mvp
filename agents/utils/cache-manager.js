/**
 * Cache Manager
 * Implements multi-tier caching strategy for templates, images, and API responses
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./logger');

class CacheManager {
    constructor() {
        this.config = {
            templates: {
                storage: 'filesystem',
                path: path.join(process.cwd(), 'cache', 'templates'),
                ttl: 86400 * 1000  // 24 hours in milliseconds
            },
            images: {
                storage: 'google-drive',
                folder: '/cache/images/',
                ttl: 604800 * 1000  // 7 days in milliseconds
            },
            apiResponses: {
                storage: 'memory',
                maxSize: 100 * 1024 * 1024, // 100MB in bytes
                ttl: 300 * 1000  // 5 minutes in milliseconds
            }
        };

        // In-memory cache for API responses
        this.memoryCache = new Map();
        this.memoryCacheSize = 0;

        // Cache metrics
        this.metrics = {
            templates: { hits: 0, misses: 0, evictions: 0 },
            images: { hits: 0, misses: 0, evictions: 0 },
            apiResponses: { hits: 0, misses: 0, evictions: 0 }
        };

        this.initializeCache();
    }

    async initializeCache() {
        // Create cache directories if they don't exist
        try {
            await fs.mkdir(this.config.templates.path, { recursive: true });
            logger.info('Cache directories initialized');
        } catch (error) {
            logger.error('Failed to initialize cache directories:', error);
        }
    }

    /**
     * Generate cache key from input parameters
     */
    generateKey(...args) {
        const data = JSON.stringify(args);
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Template caching methods
     */
    async getTemplate(templateId) {
        const key = this.generateKey('template', templateId);
        const filePath = path.join(this.config.templates.path, `${key}.json`);

        try {
            const stats = await fs.stat(filePath);
            const age = Date.now() - stats.mtime.getTime();

            if (age > this.config.templates.ttl) {
                // Cache expired
                this.metrics.templates.misses++;
                await this.evictTemplate(key);
                return null;
            }

            const data = await fs.readFile(filePath, 'utf8');
            this.metrics.templates.hits++;
            logger.debug(`Template cache hit: ${templateId}`);
            return JSON.parse(data);

        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error reading template cache:', error);
            }
            this.metrics.templates.misses++;
            return null;
        }
    }

    async setTemplate(templateId, data) {
        const key = this.generateKey('template', templateId);
        const filePath = path.join(this.config.templates.path, `${key}.json`);

        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                templateId
            };

            await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
            logger.debug(`Template cached: ${templateId}`);
            return true;

        } catch (error) {
            logger.error('Error writing template cache:', error);
            return false;
        }
    }

    async evictTemplate(key) {
        const filePath = path.join(this.config.templates.path, `${key}.json`);
        try {
            await fs.unlink(filePath);
            this.metrics.templates.evictions++;
            logger.debug(`Template evicted: ${key}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error evicting template:', error);
            }
        }
    }

    /**
     * Image caching methods (Google Drive integration)
     */
    async getImage(imageId) {
        const key = this.generateKey('image', imageId);
        
        // Check metadata in local filesystem
        const metaPath = path.join(this.config.templates.path, `${key}.meta`);

        try {
            const stats = await fs.stat(metaPath);
            const age = Date.now() - stats.mtime.getTime();

            if (age > this.config.images.ttl) {
                // Cache expired
                this.metrics.images.misses++;
                await this.evictImage(key);
                return null;
            }

            const metadata = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            this.metrics.images.hits++;
            logger.debug(`Image cache hit: ${imageId}`);
            
            // Return Google Drive URL from metadata
            return metadata;

        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error reading image cache metadata:', error);
            }
            this.metrics.images.misses++;
            return null;
        }
    }

    async setImage(imageId, driveUrl, metadata = {}) {
        const key = this.generateKey('image', imageId);
        const metaPath = path.join(this.config.templates.path, `${key}.meta`);

        try {
            const cacheData = {
                driveUrl,
                metadata,
                timestamp: Date.now(),
                imageId
            };

            await fs.writeFile(metaPath, JSON.stringify(cacheData, null, 2));
            logger.debug(`Image metadata cached: ${imageId}`);
            return true;

        } catch (error) {
            logger.error('Error writing image cache metadata:', error);
            return false;
        }
    }

    async evictImage(key) {
        const metaPath = path.join(this.config.templates.path, `${key}.meta`);
        try {
            await fs.unlink(metaPath);
            this.metrics.images.evictions++;
            logger.debug(`Image evicted: ${key}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error evicting image:', error);
            }
        }
    }

    /**
     * API Response caching methods (in-memory)
     */
    getApiResponse(endpoint, params) {
        const key = this.generateKey('api', endpoint, params);
        const cached = this.memoryCache.get(key);

        if (!cached) {
            this.metrics.apiResponses.misses++;
            return null;
        }

        const age = Date.now() - cached.timestamp;
        if (age > this.config.apiResponses.ttl) {
            // Cache expired
            this.evictApiResponse(key);
            this.metrics.apiResponses.misses++;
            return null;
        }

        this.metrics.apiResponses.hits++;
        logger.debug(`API response cache hit: ${endpoint}`);
        return cached.data;
    }

    setApiResponse(endpoint, params, data) {
        const key = this.generateKey('api', endpoint, params);
        const size = JSON.stringify(data).length;

        // Check memory limit
        if (this.memoryCacheSize + size > this.config.apiResponses.maxSize) {
            this.evictOldestApiResponses(size);
        }

        const cacheData = {
            data,
            timestamp: Date.now(),
            size
        };

        this.memoryCache.set(key, cacheData);
        this.memoryCacheSize += size;
        logger.debug(`API response cached: ${endpoint}`);
    }

    evictApiResponse(key) {
        const cached = this.memoryCache.get(key);
        if (cached) {
            this.memoryCacheSize -= cached.size;
            this.memoryCache.delete(key);
            this.metrics.apiResponses.evictions++;
        }
    }

    evictOldestApiResponses(requiredSpace) {
        const entries = Array.from(this.memoryCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        let freedSpace = 0;
        for (const [key, value] of entries) {
            if (freedSpace >= requiredSpace) break;
            freedSpace += value.size;
            this.evictApiResponse(key);
        }
    }

    /**
     * Cache invalidation methods
     */
    async invalidateTemplate(templateId) {
        const key = this.generateKey('template', templateId);
        await this.evictTemplate(key);
    }

    async invalidateImage(imageId) {
        const key = this.generateKey('image', imageId);
        await this.evictImage(key);
    }

    invalidateApiResponse(endpoint, params) {
        const key = this.generateKey('api', endpoint, params);
        this.evictApiResponse(key);
    }

    async invalidateAll() {
        // Clear templates
        try {
            const files = await fs.readdir(this.config.templates.path);
            await Promise.all(files.map(file => 
                fs.unlink(path.join(this.config.templates.path, file))
            ));
        } catch (error) {
            logger.error('Error clearing template cache:', error);
        }

        // Clear memory cache
        this.memoryCache.clear();
        this.memoryCacheSize = 0;

        logger.info('All caches invalidated');
    }

    /**
     * Cache metrics and reporting
     */
    getMetrics() {
        const calculateHitRate = (metrics) => {
            const total = metrics.hits + metrics.misses;
            return total > 0 ? (metrics.hits / total * 100).toFixed(2) : 0;
        };

        return {
            templates: {
                ...this.metrics.templates,
                hitRate: `${calculateHitRate(this.metrics.templates)}%`
            },
            images: {
                ...this.metrics.images,
                hitRate: `${calculateHitRate(this.metrics.images)}%`
            },
            apiResponses: {
                ...this.metrics.apiResponses,
                hitRate: `${calculateHitRate(this.metrics.apiResponses)}%`,
                memoryUsage: `${(this.memoryCacheSize / 1024 / 1024).toFixed(2)}MB`
            }
        };
    }

    resetMetrics() {
        this.metrics = {
            templates: { hits: 0, misses: 0, evictions: 0 },
            images: { hits: 0, misses: 0, evictions: 0 },
            apiResponses: { hits: 0, misses: 0, evictions: 0 }
        };
    }

    /**
     * Cache warming methods
     */
    async warmTemplateCache(templates) {
        logger.info(`Warming template cache with ${templates.length} templates`);
        const results = await Promise.all(
            templates.map(template => this.setTemplate(template.id, template))
        );
        const successful = results.filter(r => r).length;
        logger.info(`Template cache warmed: ${successful}/${templates.length} successful`);
    }

    /**
     * Cleanup expired cache entries
     */
    async cleanupExpiredCache() {
        logger.info('Starting cache cleanup...');
        
        // Cleanup expired templates
        try {
            const files = await fs.readdir(this.config.templates.path);
            let cleaned = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const filePath = path.join(this.config.templates.path, file);
                const stats = await fs.stat(filePath);
                const age = Date.now() - stats.mtime.getTime();

                if (age > this.config.templates.ttl) {
                    await fs.unlink(filePath);
                    cleaned++;
                }
            }

            logger.info(`Cleaned ${cleaned} expired template cache entries`);
        } catch (error) {
            logger.error('Error during cache cleanup:', error);
        }

        // Cleanup expired API responses
        for (const [key, value] of this.memoryCache.entries()) {
            const age = Date.now() - value.timestamp;
            if (age > this.config.apiResponses.ttl) {
                this.evictApiResponse(key);
            }
        }
    }
}

// Singleton instance
let cacheManagerInstance = null;

function getCacheManager() {
    if (!cacheManagerInstance) {
        cacheManagerInstance = new CacheManager();
    }
    return cacheManagerInstance;
}

module.exports = {
    getCacheManager,
    CacheManager
};