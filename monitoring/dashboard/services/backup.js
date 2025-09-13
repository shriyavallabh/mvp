const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { google } = require('googleapis');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../../backups');
    this.dataDir = path.join(__dirname, '../../../data');
    this.logsDir = path.join(__dirname, '../../../logs');
    this.drive = null;
    this.initGoogleDrive();
  }

  async initGoogleDrive() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../../../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });
      this.drive = google.drive({ version: 'v3', auth });
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
    }
  }

  async createBackup(description = 'Manual backup') {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });
      
      await this.backupDirectory(this.dataDir, path.join(backupPath, 'data'));
      await this.backupDirectory(this.logsDir, path.join(backupPath, 'logs'));
      
      await this.backupDatabase(backupPath);
      
      await this.backupGoogleSheets(backupPath);
      
      const tarFile = `${backupPath}.tar.gz`;
      await execAsync(`tar -czf ${tarFile} -C ${this.backupDir} ${backupName}`);
      
      await fs.rmdir(backupPath, { recursive: true });
      
      const metadata = {
        id: backupName,
        timestamp,
        description,
        size: (await fs.stat(tarFile)).size,
        path: tarFile,
        createdAt: new Date().toISOString()
      };
      
      await this.saveBackupMetadata(metadata);
      
      if (this.drive) {
        await this.uploadToDrive(tarFile, backupName);
      }
      
      return metadata;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async backupDirectory(source, destination) {
    try {
      await fs.mkdir(destination, { recursive: true });
      const files = await fs.readdir(source);
      
      for (const file of files) {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        const stat = await fs.stat(sourcePath);
        
        if (stat.isDirectory()) {
          await this.backupDirectory(sourcePath, destPath);
        } else {
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      console.error(`Error backing up directory ${source}:`, error);
    }
  }

  async backupDatabase(backupPath) {
    try {
      const dbFiles = [
        'campaigns.json',
        'contacts.json',
        'content-queue.json',
        'sends.json',
        'metrics.json'
      ];
      
      const dbBackupPath = path.join(backupPath, 'database');
      await fs.mkdir(dbBackupPath, { recursive: true });
      
      for (const file of dbFiles) {
        const sourcePath = path.join(this.dataDir, file);
        const exists = await fs.access(sourcePath).then(() => true).catch(() => false);
        
        if (exists) {
          await fs.copyFile(sourcePath, path.join(dbBackupPath, file));
        }
      }
    } catch (error) {
      console.error('Error backing up database:', error);
    }
  }

  async backupGoogleSheets(backupPath) {
    if (!process.env.GOOGLE_SHEET_ID) {
      return;
    }
    
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../../../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        includeGridData: true
      });
      
      const sheetsBackupPath = path.join(backupPath, 'google-sheets.json');
      await fs.writeFile(sheetsBackupPath, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error backing up Google Sheets:', error);
    }
  }

  async uploadToDrive(filePath, fileName) {
    if (!this.drive) {
      return;
    }
    
    try {
      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || 'root']
      };
      
      const media = {
        mimeType: 'application/gzip',
        body: require('fs').createReadStream(filePath)
      };
      
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name'
      });
      
      console.log(`Backup uploaded to Google Drive: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
    }
  }

  async listBackups() {
    try {
      const metadataFile = path.join(this.backupDir, 'metadata.json');
      const exists = await fs.access(metadataFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }
      
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));
      
      for (const backup of metadata) {
        const fileExists = await fs.access(backup.path).then(() => true).catch(() => false);
        backup.available = fileExists;
      }
      
      return metadata.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(backupId) {
    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup || !backup.available) {
        throw new Error('Backup not found or unavailable');
      }
      
      const tempDir = path.join(this.backupDir, 'temp-restore');
      await fs.mkdir(tempDir, { recursive: true });
      
      await execAsync(`tar -xzf ${backup.path} -C ${tempDir}`);
      
      const extractedDir = path.join(tempDir, backupId);
      
      await this.restoreDirectory(
        path.join(extractedDir, 'data'),
        this.dataDir
      );
      
      await fs.rmdir(tempDir, { recursive: true });
      
      return {
        success: true,
        message: `Backup ${backupId} restored successfully`,
        backup
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  async restoreDirectory(source, destination) {
    try {
      const files = await fs.readdir(source);
      
      for (const file of files) {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        const stat = await fs.stat(sourcePath);
        
        if (stat.isDirectory()) {
          await fs.mkdir(destPath, { recursive: true });
          await this.restoreDirectory(sourcePath, destPath);
        } else {
          const backupPath = `${destPath}.backup-${Date.now()}`;
          const exists = await fs.access(destPath).then(() => true).catch(() => false);
          
          if (exists) {
            await fs.rename(destPath, backupPath);
          }
          
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      console.error(`Error restoring directory ${source}:`, error);
      throw error;
    }
  }

  async saveBackupMetadata(metadata) {
    try {
      const metadataFile = path.join(this.backupDir, 'metadata.json');
      let existingMetadata = [];
      
      const exists = await fs.access(metadataFile).then(() => true).catch(() => false);
      if (exists) {
        existingMetadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));
      }
      
      existingMetadata.push(metadata);
      
      if (existingMetadata.length > 50) {
        existingMetadata = existingMetadata.slice(-50);
      }
      
      await fs.writeFile(metadataFile, JSON.stringify(existingMetadata, null, 2));
    } catch (error) {
      console.error('Error saving backup metadata:', error);
    }
  }

  async scheduleAutomaticBackup(intervalHours = 24) {
    setInterval(async () => {
      try {
        await this.createBackup('Scheduled automatic backup');
        console.log('Automatic backup completed');
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  async cleanOldBackups(daysToKeep = 30) {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      let deletedCount = 0;
      
      for (const backup of backups) {
        if (new Date(backup.createdAt) < cutoffDate && backup.available) {
          try {
            await fs.unlink(backup.path);
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting backup ${backup.id}:`, error);
          }
        }
      }
      
      return {
        success: true,
        message: `Deleted ${deletedCount} old backups`
      };
    } catch (error) {
      console.error('Error cleaning old backups:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();