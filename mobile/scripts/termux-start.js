#!/usr/bin/env node
// Termux-friendly launcher.
// Android caps inotify watchers, so Metro's file watcher crashes with ENOSPC. Running Expo in CI mode
// turns file watching off (no hot reload — fine for just running the app) but also hides the QR code,
// so this script finds the phone's Wi-Fi IP itself and prints the QR for Expo Go.
const os = require('os');
const { execSync, spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

const PORT = process.env.RCT_METRO_PORT || '8081';

function lanIp() {
  if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) return process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  try {
    for (const list of Object.values(os.networkInterfaces())) {
      for (const i of list || []) {
        if (i.family === 'IPv4' && !i.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(i.address)) return i.address;
      }
    }
  } catch {}
  // Android 11+ can block networkInterfaces(); fall back to `ip`
  for (const cmd of ['ip -4 addr show wlan0', 'ip -4 route get 1.1.1.1', 'ifconfig wlan0']) {
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      const m = out.match(/(?:inet |src )(\d+\.\d+\.\d+\.\d+)/);
      if (m && m[1] !== '127.0.0.1') return m[1];
    } catch {}
  }
  return null;
}

// A cache file left half-written by an earlier crashed run makes Expo log "Unexpected end of JSON input".
const fs = require('fs');
const path = require('path');
for (const d of ['native-modules-cache', 'versions-cache']) {
  try { fs.rmSync(path.join(os.homedir(), '.expo', d), { recursive: true, force: true }); } catch {}
}

const ip = lanIp();
if (!ip) {
  console.log('\nCould not detect the Wi-Fi IP automatically (are you connected to Wi-Fi / hotspot?).');
  console.log('Run:  REACT_NATIVE_PACKAGER_HOSTNAME=<ip> npm run termux\n');
  process.exit(1);
}

const url = `exp://${ip}:${PORT}`;
console.log(`\n=== FasalDost — open in Expo Go ===\n${url}\n`);
qrcode.generate(url, { small: true }, (q) => console.log(q));
console.log('Scan with Expo Go (SDK 57) on a device on the same Wi-Fi, or choose "Enter URL manually" and paste the URL above.\n');

const child = spawn('npx', ['expo', 'start', '--lan', '--port', PORT, '-c'], {
  stdio: 'inherit',
  env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_DEPENDENCY_VALIDATION: '1', REACT_NATIVE_PACKAGER_HOSTNAME: ip },
});
child.on('exit', (c) => process.exit(c ?? 0));
