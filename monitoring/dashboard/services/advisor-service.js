const { google } = require('googleapis');
const path = require('path');

class AdvisorService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
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

  async getAdvisors() {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Advisors!A:F'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      const headers = rows[0];
      const advisors = rows.slice(1).map((row, index) => ({
        id: index + 1,
        name: row[0] || '',
        arn: row[1] || '',
        phone: row[2] || '',
        status: row[3] || 'active',
        createdAt: row[4] || new Date().toISOString(),
        lastContact: row[5] || null
      }));

      return advisors;
    } catch (error) {
      console.error('Error fetching advisors:', error);
      throw error;
    }
  }

  async createAdvisor(advisorData) {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    const { name, arn, phone, status = 'active' } = advisorData;
    
    if (!name || !arn || !phone) {
      throw new Error('Name, ARN, and phone are required');
    }

    try {
      const values = [[
        name,
        arn,
        phone,
        status,
        new Date().toISOString(),
        null
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Advisors!A:F',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values }
      });

      return {
        success: true,
        message: 'Advisor created successfully',
        data: advisorData
      };
    } catch (error) {
      console.error('Error creating advisor:', error);
      throw error;
    }
  }

  async updateAdvisor(id, updates) {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const advisors = await this.getAdvisors();
      const advisorIndex = advisors.findIndex(a => a.id === parseInt(id));
      
      if (advisorIndex === -1) {
        throw new Error('Advisor not found');
      }

      const advisor = advisors[advisorIndex];
      const updatedAdvisor = { ...advisor, ...updates };
      
      const values = [[
        updatedAdvisor.name,
        updatedAdvisor.arn,
        updatedAdvisor.phone,
        updatedAdvisor.status,
        updatedAdvisor.createdAt,
        new Date().toISOString()
      ]];

      const range = `Advisors!A${advisorIndex + 2}:F${advisorIndex + 2}`;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      return {
        success: true,
        message: 'Advisor updated successfully',
        data: updatedAdvisor
      };
    } catch (error) {
      console.error('Error updating advisor:', error);
      throw error;
    }
  }

  async deleteAdvisor(id) {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    try {
      const advisors = await this.getAdvisors();
      const advisorIndex = advisors.findIndex(a => a.id === parseInt(id));
      
      if (advisorIndex === -1) {
        throw new Error('Advisor not found');
      }

      await this.updateAdvisor(id, { status: 'inactive' });

      return {
        success: true,
        message: 'Advisor marked as inactive'
      };
    } catch (error) {
      console.error('Error deleting advisor:', error);
      throw error;
    }
  }

  async getAdvisorStats() {
    try {
      const advisors = await this.getAdvisors();
      
      return {
        total: advisors.length,
        active: advisors.filter(a => a.status === 'active').length,
        inactive: advisors.filter(a => a.status === 'inactive').length,
        recentlyAdded: advisors.filter(a => {
          const createdDate = new Date(a.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length
      };
    } catch (error) {
      console.error('Error getting advisor stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        recentlyAdded: 0
      };
    }
  }
}

module.exports = new AdvisorService();