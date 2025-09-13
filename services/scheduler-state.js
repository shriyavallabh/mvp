const fs = require('fs').promises;
const path = require('path');

class SchedulerState {
  constructor() {
    this.stateFile = path.join(__dirname, '..', 'data', 'scheduler-state.json');
    this.state = {
      jobs: {},
      activeJobs: new Set(),
      lastExecution: {},
      jobResults: {}
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await this.loadState();
    } catch (error) {
      console.log('No existing state file found, creating new one');
      await this.saveState();
    }
    this.initialized = true;
  }

  async loadState() {
    const data = await fs.readFile(this.stateFile, 'utf8');
    const loadedState = JSON.parse(data);
    this.state = {
      ...this.state,
      ...loadedState,
      activeJobs: new Set(loadedState.activeJobs || [])
    };
  }

  async saveState() {
    const stateToSave = {
      ...this.state,
      activeJobs: Array.from(this.state.activeJobs)
    };
    await fs.writeFile(this.stateFile, JSON.stringify(stateToSave, null, 2));
  }

  async acquireLock(jobName) {
    await this.init();
    
    if (this.state.activeJobs.has(jobName)) {
      throw new Error(`Job ${jobName} is already running`);
    }
    
    this.state.activeJobs.add(jobName);
    this.state.jobs[jobName] = {
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      sessionId: `${jobName}-${Date.now()}`
    };
    
    await this.saveState();
    return this.state.jobs[jobName].sessionId;
  }

  async releaseLock(jobName, result = null) {
    await this.init();
    
    this.state.activeJobs.delete(jobName);
    
    if (this.state.jobs[jobName]) {
      this.state.jobs[jobName].status = result?.success ? 'COMPLETED' : 'FAILED';
      this.state.jobs[jobName].endTime = new Date().toISOString();
      this.state.jobs[jobName].result = result;
    }
    
    this.state.lastExecution[jobName] = new Date().toISOString();
    if (result) {
      this.state.jobResults[jobName] = result;
    }
    
    await this.saveState();
  }

  async isJobRunning(jobName) {
    await this.init();
    return this.state.activeJobs.has(jobName);
  }

  async getJobStatus(jobName) {
    await this.init();
    return this.state.jobs[jobName] || null;
  }

  async getLastExecution(jobName) {
    await this.init();
    return this.state.lastExecution[jobName] || null;
  }

  async getAllJobStatuses() {
    await this.init();
    return {
      activeJobs: Array.from(this.state.activeJobs),
      jobs: this.state.jobs,
      lastExecution: this.state.lastExecution
    };
  }

  async cleanup() {
    await this.init();
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    Object.keys(this.state.jobs).forEach(jobName => {
      const job = this.state.jobs[jobName];
      if (job.endTime && new Date(job.endTime) < oneDayAgo) {
        delete this.state.jobs[jobName];
      }
    });
    
    await this.saveState();
  }
}

module.exports = new SchedulerState();