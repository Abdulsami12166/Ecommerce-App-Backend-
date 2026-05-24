# Ecommerce Ecosystem Restructure Plan

## 1. Target Architecture

```text
Root/
├── ecommerce-user-app/
│   ├── android/
│   ├── ios/
│   ├── src/
│   ├── App.tsx
│   ├── index.js
│   ├── metro.config.js
│   └── package.json
├── ecommerce-admin-app/
│   ├── android/
│   ├── ios/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── analytics/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── store/
│   │   └── theme/
│   ├── App.tsx
│   ├── index.js
│   ├── metro.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── express.js
│   │   │   ├── routes.js
│   │   │   └── socket.js
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   └── activities/
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   ├── events/
│   │   │   └── constants/
│   │   └── server.js
│   ├── package.json
│   └── render.yaml
└── shared/
    ├── api-contracts/
    ├── types/
    └── docs/
```

## 2. Current Repo Findings

- The working user app is in the current `Ecommerce` folder.
- The current Android native app is misconfigured to start `AdminApp` from `android/app/src/main/java/com/ecommerce/MainActivity.kt`.
- `index.js` registers `AdminApp` instead of the user app component.
- `android/app/build.gradle` contains flavor-based entry switching and `admin` product flavor logic.
- `admin-app/` is not a standalone React Native app. It reuses `../src/context/AppContext`, `../src/theme`, and `../src/components`, which couples admin to the user app.
- User app navigation still imports embedded admin screens in `src/navigation/RootNavigator.js`.
- `src/context/AppContext.js` contains demo admin authentication and admin dashboard simulation logic mixed into the user app state.
- There are duplicate backend copies: `backend/`, `backend-admin/`, `Backend-admin/`, `Backend-Admin-Temp/`, `Ecommerce-App-Backend-Temp/`, and `Ecommerce-Github-OnlyBackend-Temp/`.
- The backend contains frontend socket client code in `backend/src/services/socketService.js`, which does not belong in the server codebase.

## 3. Files And Folders To Delete

Delete after backup and after the new apps are scaffolded:

- `Ecommerce/admin-app/`
- `Ecommerce/admin/`
- `Ecommerce/metro.admin.config.js`
- `Ecommerce/backend-admin/`
- `C:/RN/Backend-admin/`
- `C:/RN/Backend-Admin-Temp/`
- `C:/RN/Ecommerce-App-Backend-Temp/`
- `C:/RN/Ecommerce-Github-OnlyBackend-Temp/`

Delete from user app native/app wiring:

- `admin` product flavor block inside `Ecommerce/android/app/build.gradle`
- `flavorDimensions "app"` in `Ecommerce/android/app/build.gradle`
- entry-file switching logic for `admin-app/index.js` in `Ecommerce/android/app/build.gradle`
- `Ecommerce/android/app/src/admin/`
- `AdminLogin` and `AdminDashboard` routes from `Ecommerce/src/navigation/RootNavigator.js`
- admin demo state and admin simulation logic from `Ecommerce/src/context/AppContext.js`
- admin CTA from `Ecommerce/src/screens/auth/Login.js`
- admin CTA from `Ecommerce/src/screens/profile/ProfileScreen.js`
- frontend socket client file incorrectly placed at `Ecommerce/backend/src/services/socketService.js`

## 4. Files And Folders To Create

Create new root-level folders:

- `ecommerce-user-app/`
- `ecommerce-admin-app/`
- `backend/`
- `shared/`

Create inside admin app:

- `src/app/AppProviders.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/AdminTabs.tsx`
- `src/features/auth/screens/AdminLoginScreen.tsx`
- `src/features/dashboard/screens/AdminDashboardScreen.tsx`
- `src/features/users/screens/UsersScreen.tsx`
- `src/features/products/screens/ProductsScreen.tsx`
- `src/features/orders/screens/OrdersScreen.tsx`
- `src/features/analytics/screens/AnalyticsScreen.tsx`
- `src/services/api/client.ts`
- `src/services/socket/adminSocket.ts`
- `src/store/authStore.ts`
- `src/store/dashboardStore.ts`
- `src/config/env.ts`

Create inside backend:

- `src/app/express.js`
- `src/app/socket.js`
- `src/app/routes.js`
- `src/modules/auth/auth.routes.js`
- `src/modules/auth/auth.controller.js`
- `src/modules/auth/auth.service.js`
- `src/modules/auth/auth.repository.js`
- `src/modules/admin/admin.routes.js`
- `src/modules/admin/dashboard/admin-dashboard.controller.js`
- `src/modules/admin/users/admin-users.controller.js`
- `src/modules/admin/products/admin-products.controller.js`
- `src/modules/admin/orders/admin-orders.controller.js`
- `src/modules/orders/order.events.js`
- `src/modules/activities/activity.service.js`
- `src/shared/events/eventBus.js`
- `src/shared/events/socketEvents.js`
- `src/shared/middleware/errorHandler.js`
- `src/shared/middleware/requestLogger.js`
- `src/shared/utils/apiResponse.js`
- `render.yaml`

## 5. Migration Strategy

### Phase 1: Protect The Working User App

1. Copy `Ecommerce/` to `ecommerce-user-app/`.
2. Keep only user app native setup in that copy.
3. Restore correct user boot flow:
   - `index.js` must register the user app name only.
   - `MainActivity.kt` must return the user app component name only.
   - `android/app/build.gradle` must become a single-app config with no admin flavors.
4. Remove embedded admin screens from user navigation.
5. Remove demo admin state from `AppContext` without touching login, OTP, products, orders, or checkout logic.

### Phase 2: Build Admin App Cleanly

1. Generate a new standalone React Native app:
   - app name: `EcommerceAdmin`
   - package: `com.ecommerce.admin`
2. Move only reusable design tokens or utility helpers into `shared/`.
3. Do not import user app context, navigation, or mock state into admin.
4. Build admin around backend-driven data only.
5. Add its own:
   - `AppRegistry`
   - `MainActivity`
   - Android package name
   - Metro config
   - navigation tree
   - auth token storage
   - socket connection manager

### Phase 3: Merge Backend Professionally

1. Treat `Ecommerce/backend/` as the base because it already contains both `userRoutes` and `adminRoutes`.
2. Diff the richer admin behaviors from `Backend-admin/` and merge only missing features:
   - user order lookup
   - force logout
   - activity feed
   - improved admin auth handling
3. Keep current user auth endpoints unchanged:
   - `POST /api/v1/auth/login`
   - `POST /api/v1/auth/verify-otp`
   - existing product endpoints
4. Move code into modular folders by domain.
5. Keep one MongoDB connection and one Express server.
6. Keep one Socket.IO server attached to the backend HTTP server.

### Phase 4: Cut Over Deployments

1. Deploy unified backend to Render.
2. Point both apps at the same backend base URL.
3. Retire the separate admin backend Render service.
4. Build the admin app independently and validate socket traffic.

## 6. Exact Terminal Commands

From `C:\RN`:

```powershell
Rename-Item Ecommerce ecommerce-user-app
npx @react-native-community/cli@latest init EcommerceAdmin --directory ecommerce-admin-app --package-name com.ecommerce.admin
New-Item -ItemType Directory shared
Copy-Item ecommerce-user-app\backend -Destination backend -Recurse
```

Create a safety branch per repo:

```powershell
cd C:\RN\ecommerce-user-app
git checkout -b restructure/user-app-separation

cd C:\RN\Backend-admin
git checkout -b archive/admin-backend-before-merge
```

Remove broken admin artifacts from user app after the new admin app exists:

```powershell
Remove-Item -LiteralPath C:\RN\ecommerce-user-app\admin-app -Recurse -Force
Remove-Item -LiteralPath C:\RN\ecommerce-user-app\admin -Recurse -Force
Remove-Item -LiteralPath C:\RN\ecommerce-user-app\metro.admin.config.js -Force
Remove-Item -LiteralPath C:\RN\ecommerce-user-app\backend-admin -Recurse -Force
Remove-Item -LiteralPath C:\RN\Backend-admin -Recurse -Force
```

## 7. React Native Setup Commands

User app:

```powershell
cd C:\RN\ecommerce-user-app
npm install
npx react-native start --reset-cache
npx react-native run-android
```

Admin app:

```powershell
cd C:\RN\ecommerce-admin-app
npm install
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler @react-native-async-storage/async-storage socket.io-client
npx react-native start --reset-cache --port 8082
npx react-native run-android
```

## 8. Backend Merge Strategy

Base: `Ecommerce/backend`

Why:

- It already contains both user and admin routes.
- It already has OTP login and verify flow.
- It already mounts Socket.IO.
- It already exposes admin routes under `/api/v1/admin`.

Merge in from `Backend-admin` only if missing:

- stronger admin auth parsing
- extra admin user order lookup
- force logout event broadcasting
- activity feed routes and service logic

Refactor to this layering:

- `routes`: HTTP transport only
- `controllers`: request/response orchestration only
- `services`: business use cases
- `repositories`: database access
- `events`: emit domain events

Keep stable user endpoints unchanged during the restructure. Do not rename the working user auth or product APIs until both apps are already green.

## 9. Socket Architecture

### Server Rooms

- `admins` room for all authenticated admin dashboards
- `user:{userId}` room for per-user session events

### Core Events

- `auth.user.logged_in`
- `auth.user.logged_out`
- `order.created`
- `order.updated`
- `admin.dashboard.metrics_updated`
- `admin.activity.created`
- `admin.user.force_logout`

### Server Flow

1. User logs in via OTP verification.
2. Backend records activity.
3. Backend emits `auth.user.logged_in` to `admins`.
4. Admin dashboard store listens and refreshes summary cards/activity list.
5. Order creation emits `order.created` to `admins`.
6. Order status changes emit `order.updated` to both `admins` and `user:{userId}`.

### Rules

- Admin socket connection must authenticate with admin JWT during handshake.
- Do not use anonymous `subscribe-admin` events in production.
- Centralize event names in one constants file.
- Emit domain events from services, not controllers.

## 10. Render Deployment Flow

### Services

- `ecommerce-backend`: one web service
- `ecommerce-user-app`: mobile build only, no Render service needed
- `ecommerce-admin-app`: mobile build only, no Render service needed

### Render Backend Env

- `NODE_ENV=production`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_JWT_SECRET`
- `CLIENT_URL`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- provider-specific email credentials
- cloudinary or asset provider credentials

### Deployment Sequence

1. Deploy unified backend first.
2. Run smoke tests for:
   - user login
   - OTP verify
   - products list
   - admin login
   - admin metrics
   - socket connect
3. Update admin app `.env`.
4. Update user app `.env` only if backend URL changed.
5. Decommission old admin Render backend after validation.

## 11. Production Recommendations

- Use one monorepo only after separation is clean; not before.
- Prefer workspace tooling later, not during emergency recovery.
- Add health endpoints for DB, socket readiness, and email provider checks.
- Add request IDs and structured logging.
- Add API versioning with `/api/v1`.
- Add seed scripts for an initial admin user.

## 12. Scalability Recommendations

- Introduce repositories now to decouple MongoDB access from controllers.
- Move analytics aggregation into services with caching later.
- Put socket emission behind an event bus so REST handlers stay thin.
- Add pagination and filters to admin users, products, and orders endpoints.
- Use Redis adapter for Socket.IO if multi-instance deployment is needed later.

## 13. Security Recommendations

- Replace the current user token stub with real JWT or signed session tokens.
- Keep admin JWT secret separate from user JWT secret.
- Add rate limiting on login and OTP endpoints.
- Add OTP resend throttling and audit logging.
- Validate all request bodies with `zod` or `joi`.
- Require admin socket authentication in the handshake.
- Remove demo admin credentials from the user app completely.
- Store secrets only in environment variables, never in app source.

## 14. Clean API Structure

### User API

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-otp`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `GET /api/v1/orders`
- `POST /api/v1/orders`

### Admin API

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/dashboard/metrics`
- `GET /api/v1/admin/activities`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id/orders`
- `POST /api/v1/admin/users/:id/logout`
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:id/status`

## 15. Build Instructions

### User App

1. Ensure `MainActivity.kt` returns the user component name.
2. Ensure `index.js` registers only the user app.
3. Remove admin flavors and admin metro config.
4. Run:

```powershell
cd C:\RN\ecommerce-user-app
npx react-native start --reset-cache
npx react-native run-android
```

### Admin App

1. Use the generated standalone native project.
2. Set Android package to `com.ecommerce.admin`.
3. Add backend URL via env config.
4. Run:

```powershell
cd C:\RN\ecommerce-admin-app
npx react-native start --reset-cache --port 8082
npx react-native run-android
```

## 16. Android Package Setup

### User App

- package: `com.ecommerce`
- one `MainActivity`
- one `MainApplication`
- one `index.js`
- one Metro config

### Admin App

- package: `com.ecommerce.admin`
- separate `MainActivity`
- separate `MainApplication`
- separate `index.js`
- separate Metro config

Do not share native Android source between these apps.

## 17. Realtime Flow Diagram Explanation

```text
User App
  -> POST /api/v1/auth/login
  -> POST /api/v1/auth/verify-otp
  -> Backend saves UserActivity(login)
  -> Backend emits auth.user.logged_in
  -> Admin dashboards receive live activity update

User App
  -> POST /api/v1/orders
  -> Backend saves order
  -> Backend emits order.created
  -> Admin dashboards update metrics, order list, and activity feed

Admin App
  -> PATCH /api/v1/admin/orders/:id/status
  -> Backend updates order
  -> Backend emits order.updated
  -> Admin dashboards refresh
  -> User room receives updated order event
```

## 18. Immediate Next Execution Order

1. Freeze the current `Ecommerce` repo as the recovery source.
2. Duplicate it into `ecommerce-user-app/`.
3. Clean the user app boot/native wiring first.
4. Scaffold the standalone admin React Native app second.
5. Consolidate backend third.
6. Move to socket event hardening fourth.
7. Run smoke tests for user flows before deleting old admin artifacts.
