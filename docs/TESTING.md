# ShopEase Testing & Quality Assurance Guide

**Organization**: ALGIONS AI LABS PRIVATE LIMITED
**Role**: Android & Mobile Development Internship
**Project**: ShopEase E-Commerce Android Application

---

## 1. Testing Architecture & Philosophy

ShopEase utilizes a layered testing strategy designed to validate application logic, state transitions, security guards, and platform integrations without flakiness:

```
┌──────────────────────────────────────────────────────────────┐
│                    ShopEase Testing Layers                   │
├──────────────────────────────────────────────────────────────┤
│ 1. Static Analysis & Type Safety                             │
│    - TypeScript Compiler (tsc --noEmit) for Mobile & Backend │
│    - ESLint Static Rule Verification                         │
├──────────────────────────────────────────────────────────────┤
│ 2. Backend Automated Test Suite (92 Tests)                   │
│    - Auth Services & JWT Middleware                          │
│    - Product CRUD, Cloudinary Signatures & Deletion Guards   │
│    - Order Stock Validation & Server Pricing                 │
│    - Atomic Payment Simulation & Transactional Idempotency   │
├──────────────────────────────────────────────────────────────┤
│ 3. Mobile Automated Test Suite (55 Tests)                    │
│    - Zustand Cart Store & Variant Aggregate Stock Limits     │
│    - Address & Phone/PIN Format Validation                   │
│    - Offline Resilience & Error Boundary Extraction          │
│    - Payment Acceptance Rules & State Machine Assertions     │
│    - Image File Size & Magic Bytes Transcoding Reconciliation│
├──────────────────────────────────────────────────────────────┤
│ 4. Hardware & Production Smoke Checks                        │
│    - Physical Android Device Release APK Smoke Check (ADB)   │
│    - Live Production Render API Smoke Probe                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Setup

### Prerequisites
- **Node.js**: v20+ or v22+ (tested with Node.js v25)
- **npm**: v10+
- **Java Development Kit (JDK)**: OpenJDK 17 (required for Android Gradle build)
- **Android SDK**: Build tools 35.0.0+ and platform tools (`adb`)

### Repository Installation & Dependency Order
Ensure dependencies are installed in both root subprojects.

> [!IMPORTANT]
> **Dependency Order Notice**: The mobile test runner script (`npm test --prefix mobile`) shares the TypeScript execution engine (`tsx`) installed in `backend/node_modules`. Always install backend dependencies before running mobile tests:

```bash
# 1. Install backend dependencies (required first for tsx test runner)
cd backend
npm install

# 2. Install mobile dependencies
cd ../mobile
npm install
cd ..
```

---

## 3. Independent Test Execution Commands

### 3.1 Backend Test Execution
The backend test suite executes using the native Node.js test runner via `tsx`, testing against in-memory models and mocked service boundaries.

```bash
# Run all 92 backend tests
npm test --prefix backend

# Or execute directly from backend directory
cd backend
npm test
```

### 3.2 Mobile Test Execution
The mobile test suite validates all UI store logic, cart math, variant stock calculations, and offline resilience:

```bash
# Run all 55 mobile tests
npm test --prefix mobile

# Or execute directly from mobile directory
cd mobile
npm test
```

### 3.3 TypeScript Typecheck
Run type-checking without emitting build files to verify complete type safety across both projects:

```bash
# Backend TypeScript Typecheck (0 errors)
node ./backend/node_modules/typescript/bin/tsc --noEmit -p backend/tsconfig.json

# Mobile TypeScript Typecheck (0 errors)
node ./mobile/node_modules/typescript/bin/tsc --noEmit -p mobile/tsconfig.json
```

### 3.4 ESLint Static Code Analysis
Run ESLint to check for syntax, styling, and import resolution errors:

```bash
# Run ESLint on mobile source code (0 errors, 1 warning)
cd mobile
node ./node_modules/eslint/bin/eslint.js -c eslint.config.js src
```

---

## 4. Test Suite Categorization & Descriptions

### 4.1 Backend Test Suites (`backend/src/__tests__/`)
- **`auth.service.test.ts` & `auth.middleware.test.ts`**: Validates registration, duplicate email rejection (409 Conflict), bcrypt hashing, login credential validation, JWT signature verification, expired token rejection, and malformed Bearer header rejections.
- **`admin.authorization.test.ts`**: Verifies role-based access control (RBAC), ensuring standard customer tokens receive `403 Forbidden` on admin endpoints.
- **`product.crud.test.ts`**: Verifies product creation, SKU collision prevention, required field validations, update mechanics, and soft-delete behavior (`isActive: false`).
- **`product.image.test.ts`**: Validates binary magic-byte detection (JPEG, PNG, WEBP, GIF, HEIC), MIME normalization, 5MB file limits, 10 image batch limits, Cloudinary streaming, and active product deletion guards.
- **`order.service.test.ts`**: Validates aggregate stock limits across variant lines, server-side price computation from database records, ₹40 fixed delivery fee, and customer isolation.
- **`admin.order.test.ts`**: Validates admin multi-criteria search (order number, customer name, email), status filters (`PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED`), and pagination.
- **`payment.service.test.ts`**: Validates atomic MongoDB session transactions (`session.withTransaction`), stock deduction on `SUCCESS`, stock preservation on `FAILED`, and idempotency on duplicate payment calls.

### 4.2 Mobile Test Suites (`mobile/src/__tests__/`)
- **`cart-store.test.ts`**: Validates cart addition with variant keys, quantity increments, separate line creation for distinct variants, aggregate stock capping across lines, and decrement/removal.
- **`checkout-validation.test.ts`**: Validates Indian delivery addresses (10-digit phone starting with 6-9, 6-digit PIN codes) and financial calculations (subtotal, ₹40 shipping, grand total).
- **`offline-resilience.test.ts`**: Validates graceful network error extraction, offline state preservation, and session expiration guidance without unhandled crashes.
- **`payment-acceptance.test.ts`**: Verifies evaluation acceptance rules: cart is not cleared before backend confirmation, cart is strictly preserved on payment failure, and payment retry reuses the existing order ID.
- **`product-images.test.ts`**: Validates image URL resolution, MIME validation, 5MB client-side caps, and Expo/Android HEIC/PNG transcoding reconciliation.
- **`admin-orders.test.ts`**: Validates client-side admin order status badges, currency formatting (₹), customer name extraction, and debounced search filtering.

---

## 5. Physical Android Device Smoke Check Procedure

> [!NOTE]
> **Scope Notice**: This physical device procedure is a hardware **smoke check** designed to verify successful APK installation, process startup, runtime bundle integrity, and live network reachability on real Android hardware. It does **not** constitute an automated end-to-end (E2E) testing suite.

For evaluators verifying the release APK artifact on physical Android hardware or emulators:

### 5.1 Verification Checklist
1. **Connect Device via ADB**:
   ```bash
   adb devices
   # Ensure device is authorized and listed
   ```
2. **Install Standalone Release APK**:
   ```bash
   adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
   ```
3. **Launch Application Process**:
   ```bash
   adb shell monkey -p com.shopease.app 1
   ```
4. **Smoke Verification**:
   - Verify splash screen launches and transitions to catalog.
   - Verify product catalog loads from live Render backend.
   - Verify offline cart functionality by toggling Airplane Mode (items persist).
   - Test login with verified evaluator account.

---

## 6. How to Reproduce All Results Locally

To independently verify the entire quality gate from the repository root:

```bash
# 1. Typecheck both projects
node ./backend/node_modules/typescript/bin/tsc --noEmit -p backend/tsconfig.json
node ./mobile/node_modules/typescript/bin/tsc --noEmit -p mobile/tsconfig.json

# 2. Run mobile linter
cd mobile && node ./node_modules/eslint/bin/eslint.js -c eslint.config.js src && cd ..

# 3. Run all backend tests
npm test --prefix backend

# 4. Run all mobile tests
npm test --prefix mobile
```

Expected Outcome: **0 TypeScript errors, 0 ESLint errors (1 minor warning: `import/no-named-as-default-member` on `axios.create` in `api.ts`), 92/92 backend automated tests passing, 55/55 mobile automated tests passing (147 automated tests total, 100% pass rate).**
