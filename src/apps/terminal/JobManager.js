/**
 * JobManager - Manages background jobs and process control
 * Supports: background execution (&), job control (jobs, fg, bg), signals
 */
export class JobManager {
  constructor(terminal) {
    this.terminal = terminal;
    this.jobs = new Map();
    this.nextJobId = 1;
    this.currentJob = null;
    this.foregroundJob = null;
  }

  /**
   * Create and start a background job
   * @param {string} command - The command to execute
   * @returns {number} - Job ID
   */
  async createJob(command, background = false) {
    const jobId = this.nextJobId++;
    const job = {
      id: jobId,
      command,
      status: background ? 'running' : 'foreground',
      pid: `job-${jobId}`,
      startTime: Date.now(),
      output: '',
      exitCode: null
    };

    this.jobs.set(jobId, job);

    if (background) {
      // Start job in background
      this._executeJobInBackground(job);
      return jobId;
    } else {
      // Execute in foreground
      this.foregroundJob = job;
      const result = await this._executeJob(job);
      this.foregroundJob = null;
      return result;
    }
  }

  /**
   * Execute a job in the background
   */
  async _executeJobInBackground(job) {
    try {
      // Run the command asynchronously
      setTimeout(async () => {
        job.output = await this.terminal.executeCommand(job.command);
        job.status = 'done';
        job.exitCode = job.output.startsWith('❌') ? 1 : 0;
        job.endTime = Date.now();
      }, 0);
    } catch (error) {
      job.status = 'failed';
      job.output = `❌ Error: ${error.message}`;
      job.exitCode = 1;
    }
  }

  /**
   * Execute a job in the foreground
   */
  async _executeJob(job) {
    try {
      job.status = 'running';
      const result = await this.terminal.executeCommand(job.command);
      job.status = 'done';
      job.exitCode = result.startsWith('❌') ? 1 : 0;
      job.output = result;
      job.endTime = Date.now();
      return result;
    } catch (error) {
      job.status = 'failed';
      job.exitCode = 1;
      job.output = `❌ Error: ${error.message}`;
      return job.output;
    }
  }

  /**
   * List all jobs
   */
  listJobs() {
    const jobs = Array.from(this.jobs.values());

    if (jobs.length === 0) {
      return '📋 No jobs running';
    }

    let output = '┌──────┬──────────────┬────────────────────────────────────┐\n';
    output += '│ ID   │ STATUS       │ COMMAND                            │\n';
    output += '├──────┼──────────────┼────────────────────────────────────┤\n';

    jobs.forEach(job => {
      const id = `[${job.id}]`.padEnd(4);
      const status = this._getJobStatusSymbol(job.status).padEnd(12);
      const command = job.command.substring(0, 34).padEnd(34);
      output += `│ ${id} │ ${status} │ ${command} │\n`;
    });

    output += '└──────┴──────────────┴────────────────────────────────────┘';
    return output;
  }

  /**
   * Get job status symbol
   */
  _getJobStatusSymbol(status) {
    switch (status) {
      case 'running':
        return '🟢 Running';
      case 'stopped':
        return '🟡 Stopped';
      case 'done':
        return '✅ Done';
      case 'failed':
        return '❌ Failed';
      case 'foreground':
        return '▶️  Active';
      default:
        return '⚪ Unknown';
    }
  }

  /**
   * Bring a job to the foreground
   */
  async foreground(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return `❌ Job not found: ${jobId}`;
    }

    if (job.status === 'done' || job.status === 'failed') {
      return `❌ Job [${jobId}] has already completed`;
    }

    if (job.status === 'running') {
      return `❌ Job [${jobId}] is already running in background. Use 'wait ${jobId}' to wait for it.`;
    }

    // Resume the job in foreground
    job.status = 'foreground';
    this.foregroundJob = job;

    const result = await this._executeJob(job);
    this.foregroundJob = null;

    return result;
  }

  /**
   * Resume a job in the background
   */
  background(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return `❌ Job not found: ${jobId}`;
    }

    if (job.status === 'done' || job.status === 'failed') {
      return `❌ Job [${jobId}] has already completed`;
    }

    if (job.status === 'running') {
      return `💡 Job [${jobId}] is already running in background`;
    }

    // Resume in background
    job.status = 'running';
    this._executeJobInBackground(job);

    return `✅ Job [${jobId}] resumed in background`;
  }

  /**
   * Kill a job
   */
  kill(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return `❌ Job not found: ${jobId}`;
    }

    if (job.status === 'done' || job.status === 'failed') {
      return `❌ Job [${jobId}] has already completed`;
    }

    // Mark job as killed
    job.status = 'failed';
    job.exitCode = 130; // SIGINT exit code
    job.output = '❌ Killed';
    job.endTime = Date.now();

    return `✅ Job [${jobId}] killed`;
  }

  /**
   * Get job output
   */
  getJobOutput(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return `❌ Job not found: ${jobId}`;
    }

    if (job.output) {
      return `[${jobId}] ${job.status}\n${job.output}`;
    } else {
      return `[${jobId}] ${job.status} (no output yet)`;
    }
  }

  /**
   * Wait for a job to complete
   */
  async wait(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return `❌ Job not found: ${jobId}`;
    }

    if (job.status === 'done' || job.status === 'failed') {
      return job.output || `Job [${jobId}] completed with exit code ${job.exitCode}`;
    }

    // Wait for job to complete (poll every 100ms)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (job.status === 'done' || job.status === 'failed') {
          clearInterval(checkInterval);
          resolve(job.output || `Job [${jobId}] completed with exit code ${job.exitCode}`);
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(`⏱️  Timeout waiting for job [${jobId}]`);
      }, 30000);
    });
  }

  /**
   * Stop current foreground job (Ctrl+Z)
   */
  suspendForeground() {
    if (!this.foregroundJob) {
      return null;
    }

    const job = this.foregroundJob;
    job.status = 'stopped';
    this.foregroundJob = null;

    return `\n🟡 Job [${job.id}] stopped\n💡 Use 'fg ${job.id}' to resume or 'bg ${job.id}' to run in background`;
  }

  /**
   * Interrupt current foreground job (Ctrl+C)
   */
  interruptForeground() {
    if (!this.foregroundJob) {
      return null;
    }

    const job = this.foregroundJob;
    this.kill(job.id);
    this.foregroundJob = null;

    return `\n^C\n❌ Job [${job.id}] interrupted`;
  }

  /**
   * Check if there's a foreground job
   */
  hasForegroundJob() {
    return this.foregroundJob !== null;
  }

  /**
   * Get all jobs
   */
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Clean up completed jobs
   */
  cleanup() {
    for (const [id, job] of this.jobs.entries()) {
      if ((job.status === 'done' || job.status === 'failed') &&
          (Date.now() - job.endTime > 3600000)) { // 1 hour
        this.jobs.delete(id);
      }
    }
  }
}
