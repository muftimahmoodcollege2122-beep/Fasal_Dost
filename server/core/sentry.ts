// ─────────────────────────────────────────────────────────────────────────────
// server/core/sentry.ts
// Sentry-Compatible Error Tracker & Crash Reporting Integration
// ─────────────────────────────────────────────────────────────────────────────

export interface SentryEvent {
  eventId: string;
  timestamp: string;
  level: 'error' | 'fatal' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

class SentryLogger {
  private events: SentryEvent[] = [];

  public captureException(error: Error | any, context: Record<string, any> = {}): string {
    const eventId = `sentry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const event: SentryEvent = {
      eventId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
      context,
    };

    this.events.push(event);
    if (this.events.length > 200) {
      this.events.shift();
    }

    console.error(`[Sentry:${eventId}] Captured exception:`, error);
    return eventId;
  }

  public getEvents(): SentryEvent[] {
    return [...this.events];
  }
}

export const sentry = new SentryLogger();
