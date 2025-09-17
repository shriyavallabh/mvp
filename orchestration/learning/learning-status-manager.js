#!/usr/bin/env node

/**
 * Learning Status Manager
 *
 * Manages the lifecycle of learning files with status tracking:
 * - PENDING: Fresh learning file from new session
 * - READY_FOR_REVIEW: Session completed, ready for processing
 * - APPLIED: Learnings have been reviewed and applied
 * - ARCHIVED: Old learnings that are no longer relevant
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

class LearningStatusManager {
  constructor(learningDirectory = 'learning') {
    this.learningDirectory = learningDirectory;
    this.statusTypes = ['PENDING', 'READY_FOR_REVIEW', 'APPLIED', 'ARCHIVED'];
    this.statusIndex = null;
  }

  async initialize() {
    // Ensure learning directory exists
    await fs.mkdir(this.learningDirectory, { recursive: true });
    await fs.mkdir(`${this.learningDirectory}/backups`, { recursive: true });
    await fs.mkdir(`${this.learningDirectory}/archived`, { recursive: true });

    // Load or create status index
    await this.loadStatusIndex();

    console.log('📊 Learning Status Manager initialized');
  }

  async loadStatusIndex() {
    const indexPath = `${this.learningDirectory}/status-index.json`;

    try {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      this.statusIndex = JSON.parse(indexData);
    } catch (error) {
      // Create new index if doesn't exist
      this.statusIndex = {
        lastUpdated: new Date().toISOString(),
        files: {},
        statistics: {
          PENDING: 0,
          READY_FOR_REVIEW: 0,
          APPLIED: 0,
          ARCHIVED: 0
        }
      };
      await this.saveStatusIndex();
    }
  }

  async saveStatusIndex() {
    const indexPath = `${this.learningDirectory}/status-index.json`;
    this.statusIndex.lastUpdated = new Date().toISOString();

    await fs.writeFile(indexPath, JSON.stringify(this.statusIndex, null, 2));
  }

  async scanLearningFiles() {
    // Scan both flat structure (legacy) and folder structure (new)
    const flatPattern = `${this.learningDirectory}/learning-*.md`;
    const folderPattern = `${this.learningDirectory}/*/learning-*.md`;

    const flatFiles = await glob(flatPattern);
    const folderFiles = await glob(folderPattern);
    const allFiles = [...flatFiles, ...folderFiles];

    console.log(`🔍 Scanning ${allFiles.length} learning files...`);

    for (const filePath of allFiles) {
      await this.updateFileStatus(filePath);
    }

    await this.updateStatistics();
    await this.saveStatusIndex();

    return this.statusIndex.statistics;
  }

  async updateFileStatus(filePath) {
    const fileName = path.basename(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const statusMatch = content.match(/- \*\*Status\*\*: (\w+)/);

      if (statusMatch) {
        const currentStatus = statusMatch[1];

        if (this.statusTypes.includes(currentStatus)) {
          this.statusIndex.files[fileName] = {
            path: filePath,
            status: currentStatus,
            lastUpdated: new Date().toISOString(),
            sessionId: this.extractSessionId(fileName),
            size: content.length
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not read learning file: ${fileName}`);
    }
  }

  extractSessionId(fileName) {
    const match = fileName.match(/learning-(.+)\.md/);
    return match ? match[1] : 'unknown';
  }

  async updateStatistics() {
    const stats = {
      PENDING: 0,
      READY_FOR_REVIEW: 0,
      APPLIED: 0,
      ARCHIVED: 0
    };

    for (const fileInfo of Object.values(this.statusIndex.files)) {
      if (stats.hasOwnProperty(fileInfo.status)) {
        stats[fileInfo.status]++;
      }
    }

    this.statusIndex.statistics = stats;
  }

  async getFilesByStatus(status) {
    await this.scanLearningFiles();

    return Object.entries(this.statusIndex.files)
      .filter(([, info]) => info.status === status)
      .map(([fileName, info]) => ({
        fileName,
        ...info
      }));
  }

  async changeFileStatus(fileName, newStatus, reason = '') {
    if (!this.statusTypes.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${this.statusTypes.join(', ')}`);
    }

    // Find the file path (could be in flat structure or folder structure)
    let filePath = `${this.learningDirectory}/${fileName}`;

    // Check if file exists in flat structure, if not, find in folder structure
    try {
      await fs.access(filePath);
    } catch {
      // Try to find in folder structure
      const sessionId = this.extractSessionId(fileName);
      const folderPath = `${this.learningDirectory}/${sessionId}/${fileName}`;
      try {
        await fs.access(folderPath);
        filePath = folderPath;
      } catch {
        throw new Error(`Learning file not found: ${fileName}`);
      }
    }

    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Update status in file content
      content = content.replace(
        /- \*\*Status\*\*: \w+/,
        `- **Status**: ${newStatus}`
      );

      // Add status change log
      const statusChangeLog = `\n\n## Status Change Log\n- **${new Date().toISOString()}**: Changed to ${newStatus}${reason ? ` - ${reason}` : ''}\n`;

      // Add to existing status log or create new one
      if (content.includes('## Status Change Log')) {
        content = content.replace(
          /## Status Change Log\n/,
          `## Status Change Log\n- **${new Date().toISOString()}**: Changed to ${newStatus}${reason ? ` - ${reason}` : ''}\n`
        );
      } else {
        content += statusChangeLog;
      }

      await fs.writeFile(filePath, content);

      // Update index
      if (this.statusIndex.files[fileName]) {
        this.statusIndex.files[fileName].status = newStatus;
        this.statusIndex.files[fileName].lastUpdated = new Date().toISOString();
      }

      await this.updateStatistics();
      await this.saveStatusIndex();

      console.log(`✅ Status updated: ${fileName} → ${newStatus}`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to update status for ${fileName}:`, error.message);
      return false;
    }
  }

  async markSessionComplete(sessionId) {
    const fileName = `learning-${sessionId}.md`;
    return await this.changeFileStatus(fileName, 'READY_FOR_REVIEW', 'Session execution completed');
  }

  async markLearningsApplied(sessionId, appliedBy = 'learning-agent') {
    const fileName = `learning-${sessionId}.md`;
    return await this.changeFileStatus(fileName, 'APPLIED', `Learnings applied by ${appliedBy}`);
  }

  async archiveOldLearnings(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const appliedFiles = await this.getFilesByStatus('APPLIED');
    let archivedCount = 0;

    for (const file of appliedFiles) {
      const fileDate = new Date(file.lastUpdated);

      if (fileDate < cutoffDate) {
        // Move to archived directory
        const sourcePath = file.path;
        const archivePath = `${this.learningDirectory}/archived/${file.fileName}`;

        try {
          await fs.copyFile(sourcePath, archivePath);
          await fs.unlink(sourcePath);

          await this.changeFileStatus(file.fileName, 'ARCHIVED', `Auto-archived after ${daysOld} days`);
          archivedCount++;

          console.log(`📦 Archived: ${file.fileName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to archive ${file.fileName}:`, error.message);
        }
      }
    }

    console.log(`📦 Archived ${archivedCount} old learning files`);
    return archivedCount;
  }

  async generateStatusReport() {
    await this.scanLearningFiles();

    const report = `# Learning Status Report
Generated: ${new Date().toISOString()}

## Status Summary
- **PENDING**: ${this.statusIndex.statistics.PENDING} files
- **READY_FOR_REVIEW**: ${this.statusIndex.statistics.READY_FOR_REVIEW} files
- **APPLIED**: ${this.statusIndex.statistics.APPLIED} files
- **ARCHIVED**: ${this.statusIndex.statistics.ARCHIVED} files

**Total**: ${Object.values(this.statusIndex.statistics).reduce((a, b) => a + b, 0)} learning files

## Files by Status

### Ready for Review
${await this.formatFilesList('READY_FOR_REVIEW')}

### Recently Applied
${await this.formatFilesList('APPLIED')}

### Pending Sessions
${await this.formatFilesList('PENDING')}

## Next Actions
${await this.generateNextActions()}

---
*Generated by Learning Status Manager*
`;

    const reportPath = `${this.learningDirectory}/status-report-${new Date().toISOString().split('T')[0]}.md`;
    await fs.writeFile(reportPath, report);

    console.log(`📊 Status report generated: ${reportPath}`);
    return reportPath;
  }

  async formatFilesList(status) {
    const files = await this.getFilesByStatus(status);

    if (files.length === 0) {
      return '- No files in this status\n';
    }

    return files.map(file =>
      `- **${file.sessionId}** (${file.fileName}) - Last updated: ${new Date(file.lastUpdated).toLocaleDateString()}`
    ).join('\n') + '\n';
  }

  async generateNextActions() {
    const readyForReview = await this.getFilesByStatus('READY_FOR_REVIEW');
    const pending = await this.getFilesByStatus('PENDING');

    let actions = [];

    if (readyForReview.length > 0) {
      actions.push(`- 🧠 Run learning agent to process ${readyForReview.length} ready sessions`);
    }

    if (pending.length > 0) {
      actions.push(`- ⏳ ${pending.length} sessions still in progress`);
    }

    const appliedFiles = await this.getFilesByStatus('APPLIED');
    const oldApplied = appliedFiles.filter(file => {
      const fileDate = new Date(file.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return fileDate < thirtyDaysAgo;
    });

    if (oldApplied.length > 0) {
      actions.push(`- 📦 Consider archiving ${oldApplied.length} old applied learnings`);
    }

    return actions.length > 0 ? actions.join('\n') : '- All learning files are up to date';
  }

  async getBulkOperations() {
    return {
      markAllPendingReady: async () => {
        const pending = await this.getFilesByStatus('PENDING');
        let updated = 0;

        for (const file of pending) {
          const success = await this.changeFileStatus(file.fileName, 'READY_FOR_REVIEW', 'Bulk operation');
          if (success) updated++;
        }

        console.log(`✅ Marked ${updated} files as ready for review`);
        return updated;
      },

      archiveAllApplied: async () => {
        return await this.archiveOldLearnings(0); // Archive all applied immediately
      },

      resetAllToReview: async () => {
        const applied = await this.getFilesByStatus('APPLIED');
        let reset = 0;

        for (const file of applied) {
          const success = await this.changeFileStatus(file.fileName, 'READY_FOR_REVIEW', 'Bulk reset for re-processing');
          if (success) reset++;
        }

        console.log(`🔄 Reset ${reset} files to ready for review`);
        return reset;
      }
    };
  }

  // Getter methods
  getStatistics() {
    return this.statusIndex?.statistics || {};
  }

  getStatusIndex() {
    return this.statusIndex;
  }
}

export default LearningStatusManager;

// CLI interface for direct usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new LearningStatusManager();
  await manager.initialize();

  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'scan':
      await manager.scanLearningFiles();
      console.log('📊 Statistics:', manager.getStatistics());
      break;

    case 'status':
      const status = arg || 'READY_FOR_REVIEW';
      const files = await manager.getFilesByStatus(status);
      console.log(`📋 Files with status "${status}":`, files);
      break;

    case 'update':
      const [fileName, newStatus, reason] = process.argv.slice(3);
      if (fileName && newStatus) {
        await manager.changeFileStatus(fileName, newStatus, reason);
      } else {
        console.log('Usage: node learning-status-manager.js update <fileName> <newStatus> [reason]');
      }
      break;

    case 'report':
      const reportPath = await manager.generateStatusReport();
      console.log(`📊 Report generated: ${reportPath}`);
      break;

    case 'archive':
      const days = parseInt(arg) || 30;
      await manager.archiveOldLearnings(days);
      break;

    default:
      console.log(`
Learning Status Manager Commands:

scan              - Scan all learning files and update statistics
status [type]     - List files by status (PENDING, READY_FOR_REVIEW, APPLIED, ARCHIVED)
update <file> <status> [reason] - Update file status
report            - Generate status report
archive [days]    - Archive old applied learnings (default: 30 days)

Examples:
  node learning-status-manager.js scan
  node learning-status-manager.js status READY_FOR_REVIEW
  node learning-status-manager.js update learning-2025-09-17.md APPLIED "Processed by learning agent"
  node learning-status-manager.js report
  node learning-status-manager.js archive 30
      `);
  }
}