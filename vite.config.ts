import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// One id per build. Stamped into the bundle, /version.json and the service worker
// so clients can tell when a newer deploy exists.
const BUILD_ID = String(Date.now());

function stampBuild(): Plugin {
  return {
    name: 'fd-stamp-build',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(dist)) return;
      fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ version: BUILD_ID }));
      const sw = path.join(dist, 'sw.js');
      if (fs.existsSync(sw)) fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/__BUILD_ID__/g, BUILD_ID));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), stampBuild()],
  define: { __APP_BUILD__: JSON.stringify(BUILD_ID) },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
