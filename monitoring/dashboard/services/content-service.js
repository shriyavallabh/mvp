const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

class ContentService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.contentQueueFile = path.join(__dirname, '../../../data/content-queue.json');
    this.initGoogleSheets();
  }

  async initGoogleSheets() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../../../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error);
    }
  }

  async getPendingContent() {
    try {
      const exists = await fs.access(this.contentQueueFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }

      const data = JSON.parse(await fs.readFile(this.contentQueueFile, 'utf8'));
      const pendingContent = data.filter(item => item.status === 'pending_approval');
      
      return pendingContent.map(item => ({
        id: item.id,
        advisorName: item.advisorName,
        advisorARN: item.advisorARN,
        content: item.content,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
        status: item.status,
        complianceScore: item.complianceScore || 100,
        fatigueScore: item.fatigueScore || 0
      }));
    } catch (error) {
      console.error('Error getting pending content:', error);
      return [];
    }
  }

  async approveContent(contentId) {
    try {
      const exists = await fs.access(this.contentQueueFile).then(() => true).catch(() => false);
      
      if (!exists) {
        throw new Error('Content queue not found');
      }

      const data = JSON.parse(await fs.readFile(this.contentQueueFile, 'utf8'));
      const contentIndex = data.findIndex(item => item.id === contentId);
      
      if (contentIndex === -1) {
        throw new Error('Content not found');
      }

      data[contentIndex].status = 'approved';
      data[contentIndex].approvedAt = new Date().toISOString();
      
      await fs.writeFile(this.contentQueueFile, JSON.stringify(data, null, 2));

      if (this.sheets) {
        await this.updateContentInSheets(contentId, 'approved');
      }

      return {
        success: true,
        message: 'Content approved successfully',
        content: data[contentIndex]
      };
    } catch (error) {
      console.error('Error approving content:', error);
      throw error;
    }
  }

  async rejectContent(contentId, reason) {
    try {
      const exists = await fs.access(this.contentQueueFile).then(() => true).catch(() => false);
      
      if (!exists) {
        throw new Error('Content queue not found');
      }

      const data = JSON.parse(await fs.readFile(this.contentQueueFile, 'utf8'));
      const contentIndex = data.findIndex(item => item.id === contentId);
      
      if (contentIndex === -1) {
        throw new Error('Content not found');
      }

      data[contentIndex].status = 'rejected';
      data[contentIndex].rejectedAt = new Date().toISOString();
      data[contentIndex].rejectionReason = reason;
      
      await fs.writeFile(this.contentQueueFile, JSON.stringify(data, null, 2));

      if (this.sheets) {
        await this.updateContentInSheets(contentId, 'rejected', reason);
      }

      return {
        success: true,
        message: 'Content rejected',
        content: data[contentIndex]
      };
    } catch (error) {
      console.error('Error rejecting content:', error);
      throw error;
    }
  }

  async updateContentInSheets(contentId, status, reason = null) {
    if (!this.sheets) {
      return;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Content!A:G'
      });

      const rows = response.data.values || [];
      const contentRowIndex = rows.findIndex(row => row[0] === contentId);
      
      if (contentRowIndex > 0) {
        const values = [[
          contentId,
          rows[contentRowIndex][1],
          rows[contentRowIndex][2],
          status,
          rows[contentRowIndex][4],
          new Date().toISOString(),
          reason || ''
        ]];

        const range = `Content!A${contentRowIndex + 1}:G${contentRowIndex + 1}`;
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values }
        });
      }
    } catch (error) {
      console.error('Error updating content in sheets:', error);
    }
  }

  async getContentStats() {
    try {
      const exists = await fs.access(this.contentQueueFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          delivered: 0
        };
      }

      const data = JSON.parse(await fs.readFile(this.contentQueueFile, 'utf8'));
      
      return {
        total: data.length,
        pending: data.filter(item => item.status === 'pending_approval').length,
        approved: data.filter(item => item.status === 'approved').length,
        rejected: data.filter(item => item.status === 'rejected').length,
        delivered: data.filter(item => item.status === 'delivered').length
      };
    } catch (error) {
      console.error('Error getting content stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        delivered: 0
      };
    }
  }

  async getRecentContent(limit = 10) {
    try {
      const exists = await fs.access(this.contentQueueFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }

      const data = JSON.parse(await fs.readFile(this.contentQueueFile, 'utf8'));
      
      return data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent content:', error);
      return [];
    }
  }
}

module.exports = new ContentService();