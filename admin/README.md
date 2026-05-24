# Admin Panel (Separate App)

This folder is reserved for a truly separate Admin app build (optional depending on your setup).

## What is already done in this repo
- Separate **admin backend server**: `backend-admin/`
  - Serves admin APIs under: `/api/v1/admin/*`

## Next to make it a separate frontend app
- Create a separate React Native (or web) app under this folder
- Copy/adminize navigation:
  - Login page (Admin email/password)
  - Dashboard
  - Products management
  - Orders
  - Users

## Current state
Your existing screens already include:
- `src/screens/admin/AdminLoginScreen.js`
- `src/screens/admin/AdminDashboardScreen.js`

But that is inside the main ecommerce app.

