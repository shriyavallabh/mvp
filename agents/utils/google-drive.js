/**
 * Google Drive Integration Utility
 * Handles content storage and backup operations
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.initialized = false;
    
    // Rate limiting
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.maxRequestsPer100Seconds = 100;
    
    // Configuration
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    this.retentionDays = 30;
    
    this.initialize();
  }

  /**
   * Initialize Google Drive API client
   */
  async initialize() {
    try {
      // OAuth2 client setup
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });

      this.auth = oauth2Client;
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.initialized = true;
      
      logger.info('[GoogleDrive] Service initialized successfully');
    } catch (error) {
      logger.error('[GoogleDrive] Initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Create folder structure for advisor
   */
  async createAdvisorFolder(advisorArn) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    await this.enforceRateLimit();

    try {
      // Check if folder already exists
      const existingFolder = await this.findFolder(advisorArn);
      if (existingFolder) {
        return existingFolder.id;
      }

      // Create advisor folder
      const folderMetadata = {
        name: advisorArn,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.rootFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name'
      });

      logger.info(`[GoogleDrive] Created folder for advisor ${advisorArn}`);
      return folder.data.id;

    } catch (error) {
      logger.error('[GoogleDrive] Failed to create advisor folder:', error);
      throw error;
    }
  }

  /**
   * Upload content with metadata
   */
  async uploadContent(advisorArn, contentId, content, metadata) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    await this.enforceRateLimit();

    try {
      // Get or create advisor folder
      const advisorFolderId = await this.createAdvisorFolder(advisorArn);

      // Create date-based subfolder
      const date = new Date().toISOString().split('T')[0];
      const dateFolderId = await this.createDateFolder(advisorFolderId, date);

      // Prepare content as JSON
      const contentData = JSON.stringify({
        content_id: contentId,
        advisor_arn: advisorArn,
        timestamp: new Date().toISOString(),
        content,
        metadata
      }, null, 2);

      // Upload file
      const fileMetadata = {
        name: `${contentId}.json`,
        parents: [dateFolderId],
        description: `Content for ${advisorArn} - ${contentId}`
      };

      const media = {
        mimeType: 'application/json',
        body: contentData
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      logger.info(`[GoogleDrive] Uploaded content ${contentId} for advisor ${advisorArn}`);
      
      return {
        fileId: file.data.id,
        fileName: file.data.name,
        webViewLink: file.data.webViewLink
      };

    } catch (error) {
      logger.error('[GoogleDrive] Failed to upload content:', error);
      throw error;
    }
  }

  /**
   * Upload image file
   */
  async uploadImage(advisorArn, imageUrl, platform) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    await this.enforceRateLimit();

    try {
      // Get or create advisor folder
      const advisorFolderId = await this.createAdvisorFolder(advisorArn);

      // Create images subfolder
      const imagesFolderId = await this.createSubfolder(advisorFolderId, 'images');

      const date = new Date().toISOString().split('T')[0];
      const fileName = `${date}_${platform}_image.png`;

      // In production, would download image from URL
      // For now, just save the URL reference
      const imageMetadata = {
        url: imageUrl,
        platform,
        timestamp: new Date().toISOString()
      };

      const fileMetadata = {
        name: `${fileName}.json`,
        parents: [imagesFolderId],
        description: `Image reference for ${platform}`
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(imageMetadata)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      logger.info(`[GoogleDrive] Uploaded image reference for ${platform}`);
      
      return {
        fileId: file.data.id,
        fileName: file.data.name,
        webViewLink: file.data.webViewLink
      };

    } catch (error) {
      logger.error('[GoogleDrive] Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from Drive
   */
  async retrieveContent(contentId) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    await this.enforceRateLimit();

    try {
      // Search for file by name
      const response = await this.drive.files.list({
        q: `name='${contentId}.json' and trashed=false`,
        fields: 'files(id, name, parents)',
        spaces: 'drive'
      });

      if (response.data.files.length === 0) {
        return null;
      }

      const fileId = response.data.files[0].id;

      // Download file content
      const file = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return JSON.parse(file.data);

    } catch (error) {
      logger.error('[GoogleDrive] Failed to retrieve content:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    const cutoffDateStr = cutoffDate.toISOString();

    await this.enforceRateLimit();

    try {
      // Find old files
      const response = await this.drive.files.list({
        q: `modifiedTime < '${cutoffDateStr}' and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive'
      });

      const filesToDelete = response.data.files;
      
      logger.info(`[GoogleDrive] Found ${filesToDelete.length} files older than ${this.retentionDays} days`);

      // Delete old files
      for (const file of filesToDelete) {
        await this.enforceRateLimit();
        
        await this.drive.files.delete({
          fileId: file.id
        });
        
        logger.info(`[GoogleDrive] Deleted old file: ${file.name}`);
      }

      return filesToDelete.length;

    } catch (error) {
      logger.error('[GoogleDrive] Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * Find folder by name
   */
  async findFolder(folderName) {
    const response = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    return response.data.files[0] || null;
  }

  /**
   * Create date-based subfolder
   */
  async createDateFolder(parentId, date) {
    await this.enforceRateLimit();

    // Check if folder exists
    const response = await this.drive.files.list({
      q: `name='${date}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new folder
    const folderMetadata = {
      name: date,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  }

  /**
   * Create subfolder
   */
  async createSubfolder(parentId, folderName) {
    await this.enforceRateLimit();

    // Check if folder exists
    const response = await this.drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new folder
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  }

  /**
   * Enforce rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every 100 seconds
    if (timeSinceReset >= 100000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if we've hit the limit
    if (this.requestCount >= this.maxRequestsPer100Seconds) {
      const waitTime = 100000 - timeSinceReset;
      logger.warn(`[GoogleDrive] Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
      
      // Reset after waiting
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      request_count: this.requestCount,
      last_reset: new Date(this.lastResetTime).toISOString()
    };
  }
}

// Export singleton instance
module.exports = new GoogleDriveService();

// Also export class for testing
module.exports.GoogleDriveService = GoogleDriveService;