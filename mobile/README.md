# FasalDost Mobile Application (React Native & Expo)

Cross-platform mobile application for Android & iOS with AI crop leaf disease scanning, camera integration, and Urdu voice narration.

## Getting Started Locally

### 1. Install Dependencies
Inside the `mobile` directory, run:
```bash
npm install
```

### 2. Start the Local Expo Development Server
```bash
npx expo start
```
Or for Android directly:
```bash
npx expo start --android
```
Or for iOS directly:
```bash
npx expo start --ios
```

### 3. Build Native Android APK / AAB or iOS IPA
Install EAS CLI globally (one-time setup):
```bash
npm install -g eas-cli
```

Build for Android:
```bash
npx eas build --platform android --profile preview
```

Build for iOS:
```bash
npx eas build --platform ios --profile preview
```
