// Resolves the FasalDost backend URL for the mobile app.
// Priority: EXPO_PUBLIC_API_URL  ->  dev-server host on :3000  ->  deployed server.
import Constants from 'expo-constants';

const DEPLOYED = 'https://ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';

function resolve(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const hostUri: string | undefined = (Constants.expoConfig as any)?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    if (host && !host.includes('exp.direct') && !host.includes('.run.app')) return `http://${host}:3000`;
  }
  return DEPLOYED;
}

export const API_BASE_URL = resolve();
export const apiUrl = (path: string) => (/^https?:/.test(path) ? path : `${API_BASE_URL}${path}`);
// Server returns relative media URLs like /uploads/...; make them loadable on device.
export const mediaUrl = (u?: string | null) => (!u ? '' : u.startsWith('/') ? `${API_BASE_URL}${u}` : u);
