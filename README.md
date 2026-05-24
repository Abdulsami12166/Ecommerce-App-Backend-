# Ecommerce Fullstack Workspace

This repository now contains:

- the current React Native app at the repository root
- a scalable `mobile/` scaffold for a separated frontend workspace
- a scalable `backend/` scaffold using Node.js, Express, MongoDB, Mongoose, JWT, Cloudinary, Multer, and Nodemon

## Workspace Structure

```text
Ecommerce
│
├── mobile
├── backend
├── android
├── ios
├── src
└── ...
```

## Notes

- The existing React Native CLI app at the root was left intact so the current project does not break.
- The new `mobile/` folder is a clean scalable workspace scaffold for future migration or monorepo separation.
- The new `backend/` folder is ready for API development and environment-based configuration.
- Sensitive credentials are stored in `backend/.env`, which is ignored by git.

## Backend Quick Start

```bash
cd backend
npm install
npm run dev
```

## Mobile Scaffold Quick Start

```bash
cd mobile
npm install
npm start
```

## Android Run Fix

The default React Native emulator launch can leave `adb` with an `offline` emulator and then `installDebug` fails with `No online devices found`.

Use this project command from the repository root instead:

```bash
npm run android
```

It now:

- restarts `adb`
- clears stale offline emulator sessions
- boots `Medium_Phone` without restoring a bad snapshot
- waits for Android boot completion
- installs the app on the detected emulator explicitly

If you still want the raw React Native CLI behavior, use:

```bash
npm run android:cli
```

## API Setup For Other Phones

Right now the mobile app can be switched between a local backend and a public backend from one file:

[apiConfig.js](C:/RN/Ecommerce/src/config/apiConfig.js)

It contains:

- `mode: 'local'` for your current LAN IP development setup
- `localBaseUrl` for backend testing on your own Wi-Fi
- `publicBaseUrl` for a deployed backend that works on other networks

To make the APK work on your friend's phone or any different network:

1. Deploy the backend online.
2. Put that URL into `publicBaseUrl`.
3. Change `mode` from `'local'` to `'public'`.
4. Rebuild the APK.

Example:

```js
export const API_CONFIG = {
  mode: 'public',
  localBaseUrl: 'http://192.168.31.18:5000/api/v1',
  publicBaseUrl: 'https://your-backend-url.example.com/api/v1',
};
```

Until the backend is deployed publicly, the APK will still only fully work on devices that can reach your local network backend.

## Backend Flow Included

1. Authentication
2. Product APIs
3. Cart APIs
4. Wishlist hooks through user endpoints
5. Orders
6. Payments
7. Admin-ready role handling
