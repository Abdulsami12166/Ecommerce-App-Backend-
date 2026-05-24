# TODO - Separate Admin App

## Step 1: Scaffold separate admin RN app entry
- [x] Create `admin-app/index.js`
- [x] Create `admin-app/AppAdmin.tsx`


## Step 2: Create admin-only navigation root
- [x] Create `admin-app/navigation/RootNavigatorAdmin.js`


## Step 3: Admin Metro config (entry override)
- [x] Create `metro.admin.config.js`


## Step 4: Add npm scripts for admin app
- [x] Update root `package.json` with `start:admin`, `android:admin`, `ios:admin`


## Step 5: Verify build/run
- [ ] Run `npm run start:admin`
- [ ] Run `npm run android:admin` (or `ios:admin`)


## Step 6: (If needed) isolate admin dependencies
- [ ] Adjust API base config for admin endpoints (if current admin screens use customer API base)
- [ ] If admin screens require AppContext demo creds, ensure admin app still authenticates properly

