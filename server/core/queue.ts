// ─────────────────────────────────────────────────────────────────────────────
// server/core/queue.ts
// BullMQ-Compatible Async Job Queue Worker for Background Tasks & AI Processing
// ─────────────────────────────────────────────────────────────────────────────

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  attempts: number;
  timestamp: number;
}

export type JobHandler<T = any, R = any> = (job: Job<T>) => Promise<R>;

export class JobQueue<T = any> {
  private name: string;
  private queue: Job<T>[] = [];
  private handlers = new Map<string, JobHandler<T>>();
  private isProcessing = false;

  constructor(name: string) {
    this.name = name;
  }

  public registerWorker(jobName: string, handler: JobHandler<T>) {
    this.handlers.set(jobName, handler);
  }

  public async add(jobName: string, data: T, options: { priority?: number; delay?: number } = {}): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const job: Job<T> = {
      id: jobId,
      name: jobName,
      data,
      attempts: 0,
      timestamp: Date.now(),
    };

    if (options.delay && options.delay > 0) {
      setTimeout(() => {
        this.queue.push(job);
        this.processNext();
      }, options.delay);
    } else {
      this.queue.push(job);
      this.processNext();
    }

    return jobId;
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    if (job) {
      const handler = this.handlers.get(job.name);
      if (handler) {
        try {
          job.attempts += 1;
          await handler(job);
        } catch (err) {
          console.error(`[JobQueue:${this.name}] Job ${job.id} failed (attempt ${job.attempts}):`, err);
          if (job.attempts < 3) {
            this.queue.push(job);
          }
        }
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }
}

// Pre-configured Queues
export const diagnosticsQueue = new JobQueue<{ scanId: string; imageBase64: string; cropName: string }>('diagnostics');
export const notificationQueue = new JobQueue<{ to: string; subject: string; body: string }>('notifications');
export const searchIndexQueue = new JobQueue<{ action: 'upsert' | 'delete'; type: string; id: string; payload: any }>('search-index');
