import { API_BASE_URL } from './api';
import { getDeviceUid } from './identity';

async function call(path: string, init?: RequestInit) {
  const uid = await getDeviceUid();
  const res = await fetch(`${API_BASE_URL}/api/subscriptions${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-user-uid': uid, 'x-client-platform': 'android', ...(init?.headers as any) },
  });
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (!res.ok || !body?.success) throw new Error(body?.message || `Request failed (${res.status})`);
  return body;
}

export const subscriptionsApi = {
  getPlans: () => call('/plans'),
  getCurrent: () => call('/current'),
  subscribe: (data: { plan: string; billingCycle: string; paymentMethod: string; paymentReference: string }) =>
    call('/subscribe', { method: 'POST', body: JSON.stringify(data) }),
};
