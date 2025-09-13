const pm2 = require('pm2');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

class PM2Monitor {
  constructor() {
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      return new Promise((resolve, reject) => {
        pm2.connect((err) => {
          if (err) {
            reject(err);
          } else {
            this.connected = true;
            resolve();
          }
        });
      });
    }
  }

  async getProcessList() {
    await this.connect();
    return new Promise((resolve, reject) => {
      pm2.list((err, list) => {
        if (err) {
          reject(err);
        } else {
          const processes = list.map(proc => ({
            name: proc.name,
            pid: proc.pid,
            status: proc.pm2_env.status,
            cpu: proc.monit.cpu,
            memory: proc.monit.memory,
            uptime: Date.now() - proc.pm2_env.created_at,
            restarts: proc.pm2_env.restart_time,
            instances: proc.pm2_env.instances || 1
          }));
          resolve(processes);
        }
      });
    });
  }

  async getSystemHealth() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const loadAvg = os.loadavg();
    
    let diskUsage = { total: 0, used: 0, free: 0, percentage: 0 };
    try {
      const { stdout } = await exec("df -h / | awk 'NR==2 {print $2,$3,$4,$5}'");
      const [total, used, free, percentage] = stdout.trim().split(' ');
      diskUsage = { total, used, free, percentage };
    } catch (error) {
      console.error('Error getting disk usage:', error);
    }

    const processes = await this.getProcessList();
    const runningProcesses = processes.filter(p => p.status === 'online').length;
    
    return {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime()
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0].model,
        loadAverage: {
          '1min': loadAvg[0],
          '5min': loadAvg[1],
          '15min': loadAvg[2]
        }
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        percentage: ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2)
      },
      disk: diskUsage,
      processes: {
        total: processes.length,
        running: runningProcesses,
        stopped: processes.length - runningProcesses
      }
    };
  }

  async restartProcess(processName) {
    await this.connect();
    return new Promise((resolve, reject) => {
      pm2.restart(processName, (err, proc) => {
        if (err) {
          reject(err);
        } else {
          resolve(proc);
        }
      });
    });
  }

  async stopProcess(processName) {
    await this.connect();
    return new Promise((resolve, reject) => {
      pm2.stop(processName, (err, proc) => {
        if (err) {
          reject(err);
        } else {
          resolve(proc);
        }
      });
    });
  }

  async startProcess(processName) {
    await this.connect();
    return new Promise((resolve, reject) => {
      pm2.start(processName, (err, proc) => {
        if (err) {
          reject(err);
        } else {
          resolve(proc);
        }
      });
    });
  }

  async getProcessLogs(processName, lines = 100) {
    try {
      const { stdout } = await exec(`pm2 logs ${processName} --lines ${lines} --nostream`);
      return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Error getting process logs:', error);
      return [];
    }
  }
}

module.exports = new PM2Monitor();