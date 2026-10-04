# Over-the-air updates (Play Store / App Store)

## Web (and the Play Store web wrapper)
Nothing to ship through a store. Deploy the server (`npm run build && npm start`) and every client updates:
- Each build is stamped (`dist/version.json` + service worker). Open tabs / installed PWAs check on focus and every 15–30 min.
- When a newer build exists a banner "A new version is ready — Update" appears; tapping it reloads onto the new version.
- `sw.js`, `version.json`, `index.html` are served `no-store`; hashed `/assets/*` are cached forever.
- To publish the web app on Google Play, wrap the live URL as a TWA (PWABuilder / Bubblewrap). The TWA loads your site, so web updates reach it instantly.

## Mobile (Expo / EAS Update)
OTA updates replace the **JavaScript + assets** (screens, logic, translations, styles). They do NOT work in Expo Go or dev builds — only in a store/preview build.

### One-time setup (needs your Expo account)
```bash
cd mobile
npm install --legacy-peer-deps
npm i -g eas-cli
eas login
eas init                    # creates the project, writes extra.eas.projectId to app.json
eas update:configure        # writes updates.url + channel wiring to app.json / eas.json
```
Commit the changed `app.json` / `eas.json`.

### First store release (once)
```bash
npm run build:android       # AAB for Google Play  (profile "production", channel "production")
npm run build:ios           # IPA for App Store
npm run submit:android      # optional: upload to Play Console
```

### Every later change (no store review)
```bash
cd mobile
npm run ota:production -- "fix marketplace filter"
```
Installed apps check on launch and whenever the app returns to the foreground, download in the background, and show a "Restart" banner.

### When you still need a new store build
Anything native: adding/upgrading an Expo/RN native package, changing `app.json` permissions/plugins, upgrading the Expo SDK.
`runtimeVersion` uses the `fingerprint` policy, so an OTA update is only delivered to binaries with a matching native layer — incompatible apps are never sent broken JS.

### Channels
`preview` (internal APK testing) · `production` (store builds). Publish with `npm run ota:preview` to test before `ota:production`.
