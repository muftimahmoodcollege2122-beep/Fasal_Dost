# FasalDost Mobile (Expo SDK 57)

Native twin of the web app: same 14 screens, same flow (Splash → Onboarding → Auth → Home …),
same i18n (6 languages), same store/API layer, styled with NativeWind (Tailwind) so classes match web.

## Run on Termux / phone
```bash
cd mobile
npm install --legacy-peer-deps
# point the app at your backend (the Express server on port 3000):
export EXPO_PUBLIC_API_URL=http://<server-ip>:3000     # optional; in dev it auto-uses the Expo host on :3000
npx expo start -c
```
Scan the QR with Expo Go. Start the backend separately from the repo root (`npm run dev`).

## Notes
- Google sign-in and phone-OTP are browser-only flows; the mobile app uses email/password.
- `npm test` runs a render smoke test for every screen.
