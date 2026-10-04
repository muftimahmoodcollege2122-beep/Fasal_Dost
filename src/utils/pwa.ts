// Web "over-the-air" updates: a new deploy is detected by (a) the service worker and
// (b) polling /version.json, so users on the browser, installed PWA, or Play Store wrapper all get it.
declare const __APP_BUILD__: string;

export const UPDATE_EVENT = 'fd-update-ready';
let waitingWorker: ServiceWorker | null = null;
let notified = false;

const notify = () => {
  if (notified) return;
  notified = true;
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export async function checkVersion(): Promise<void> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.version && data.version !== __APP_BUILD__) notify();
  } catch {
    /* offline — try again later */
  }
}

export function applyUpdate(): void {
  if (waitingWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waitingWorker.postMessage('SKIP_WAITING');
    setTimeout(() => window.location.reload(), 1500);
  } else {
    window.location.reload();
  }
}

export function registerPwa(): void {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        const track = (w: ServiceWorker | null) => {
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = reg.waiting || w;
              notify();
            }
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingWorker = reg.waiting;
          notify();
        }
        reg.addEventListener('updatefound', () => track(reg.installing));
        const ping = () => reg.update().catch(() => {});
        setInterval(ping, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && ping());
      }).catch((e) => console.warn('[PWA] SW registration failed', e));
    });
  }

  // Fallback for browsers without service workers
  checkVersion();
  setInterval(checkVersion, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkVersion());
}
