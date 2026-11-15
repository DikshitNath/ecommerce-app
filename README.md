# ShopEase – E-Commerce Android Mobile Application

![React Native](https://img.shields.io/badge/React_Native-0.88.1-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?style=flat-square&logo=expo&logoColor=white)
![Android](https://img.shields.io/badge/Android-API_24+-34A853?style=flat-square&logo=android&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-v5-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-9.0-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white)

ShopEase is a full-stack, mobile-first e-commerce shopping application built for Android using **React Native, Expo (SDK 58), TypeScript, Node.js, Express.js (v5), MongoDB, and Cloudinary CDN**.

The application delivers an end-to-end shopping journey from product discovery and variant selection to server-validated checkout, simulated payment processing, live order tracking, and an administrative store management portal with cloud-hosted product image storage.

---

## Table of Contents

1. [Project Overview & Key Features](#project-overview--key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design](#architecture--design)
4. [Prerequisites & Minimum Android Version](#prerequisites--minimum-android-version)
5. [Environment Configuration & Variables](#environment-configuration--variables)
6. [Live Production Deployment & Health Endpoint](#live-production-deployment--health-endpoint)
7. [Evaluator Demo Credentials & Verification](#evaluator-demo-credentials--verification)
8. [Backend Setup & Database Configuration](#backend-setup--database-configuration)
9. [Running the Application](#running-the-application)
10. [Automated Testing & Quality Verification](#automated-testing--quality-verification)
11. [Release APK Generation & Installation Guide](#release-apk-generation--installation-guide)
12. [Security, Persistence & Offline Resilience](#security-persistence--offline-resilience)
13. [Backend REST API Endpoints](#backend-rest-api-endpoints)
14. [Clean Android Installation & Demonstration Walkthrough](#clean-android-installation--demonstration-walkthrough)
15. [Known Limitations](#known-limitations)
16. [Project Directory Structure](#project-directory-structure)
17. [AI Usage, Attribution & Submission Declarations](#ai-usage-attribution--submission-declarations)

---

## Project Overview & Key Features

### Customer Shopping Experience
- **Product Discovery & Exploration**: Browse products by category (Fashion, Electronics, Shoes, Watches) with live search and filtering.
- **Multi-Attribute Product Variants**: Select independent combinations (e.g. Size: `M`, Color: `Blue`). Stock availability is tracked and validated per aggregate product inventory.
- **Cart Management**: Add, increment, decrement, and remove items with real-time stock cap enforcement. Persistent across app restarts.
- **Checkout & Address Validation**: Shipping address validation with strict Indian 10-digit mobile phone (`^[6-9]\d{9}$`) and 6-digit PIN code (`^[1-9]\d{5}$`) regex validation.
- **Simulated Payment Processing**: Two-phase payment simulation (`SUCCESS` / `FAILED`):
  - On `SUCCESS`: Order confirmed, stock atomically deducted in MongoDB transactions, cart cleared.
  - On `FAILED`: Order marked failed, cart strictly preserved for customer retry without duplicate order creation.
- **Live Order Tracking**: Customer order history with live status badges (`PENDING`, `CONFIRMED`, `FAILED`) and detailed itemized receipts.

### Administrator Store Management
- **Role-Based Authorization**: Protected routes and APIs enforced via JWT Bearer tokens and `requireAdmin` middleware.
- **Product CRUD**: Create, update, and soft-delete (`isActive: false`) products.
- **Cloud Media Management**: Product images are uploaded directly to **Cloudinary** (`shopease/products`) via in-memory stream buffers, returning persistent HTTPS URLs.
- **Image Deletion & Reference Guard**: Delete unreferenced images from Cloudinary with safety guards preventing deletion of images currently referenced by active products.
- **MIME & Signature Validation**: Server-side binary magic bytes inspection (JPEG, PNG, WEBP, GIF, HEIC) with Android transcoding reconciliation.
- **Admin Order Dashboard**: Live customer order feed with status filter tabs (`ALL`, `PENDING`, `CONFIRMED`, `FAILED`).
- **Debounced Server Search**: Real-time 400ms debounced search matching Order Number, Customer Name, and Customer Email via indexed MongoDB queries with pagination synchronization.

---

## Technology Stack

### Mobile Application
- **Framework**: React Native 0.88.1 with Expo SDK 58 (~58.0.23)
- **Navigation & Routing**: Expo Router v58 (~58.0.30, file-based navigation with stack and custom safe-area tabs)
- **Language**: TypeScript (~6.0.3)
- **State Management**: Zustand v5 (^5.1.0)
- **Local Persistence**: `@react-native-async-storage/async-storage` (v2.2.0, cart & preferences)
- **Secure Storage**: `expo-secure-store` (~58.0.3, hardware-backed Keystore for JWT session tokens)
- **Server State & Caching**: TanStack React Query v5 (^5.107.1)
- **Networking**: Axios v1.21 (^1.21.0) with automated request interceptors
- **Media & UI**: `expo-image`, `expo-image-picker`, `react-native-safe-area-context`, `react-native-reanimated`
- **Linter**: ESLint 9 (^9.39.5) with `eslint-config-expo` (~58.0.4)

### Backend Server
- **Runtime**: Node.js (v20+ / v22+ LTS)
- **Framework**: Express.js v5 (^5.3.0)
- **Language**: TypeScript (~7.0.2) with `tsx` (^4.23.15) execution runner
- **Database**: MongoDB (Atlas or local replica set for transaction support)
- **ODM**: Mongoose v9 (^9.12.0)
- **Cloud Media Storage**: Official Cloudinary Node.js SDK v2 (^2.11.0)
- **File Uploads**: `multer` v2 (^2.5.0) with in-memory buffer storage (5MB limit per image, 10 images per batch)
- **Authentication**: JSON Web Tokens (`jsonwebtoken` ^9.0.3) & `bcryptjs` (^3.0.3, 12 salt rounds)
- **Validation**: Schema validation with custom binary signature checkers and `zod` (^4.6.7)

---

## Architecture & Design

### Layered Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATION (EXPO)                      │
│                                                                   │
│   [ Presentation Layer ]                                          │
│   Expo Router Screens: (tabs), product-details, checkout,         │
│   payment, order-details, admin, admin-orders, admin-add-product  │
│                           │                                       │
│   [ UI Design System ]    ▼                                       │
│   ScreenHeader (Safe Area Insets) ◄────► TabIcon (Vector Icons)   │
│                           │                                       │
│   [ State & Data Layer ]  ▼                                       │
│   TanStack React Query ◄────► Zustand Stores (Cart, Auth, Order)  │
│                           │         │                             │
│   [ Persistence Layer ]   │         ▼                             │
│   AsyncStorage (Cart)     │   Expo SecureStore (JWT Tokens)       │
│                           ▼                                       │
│   [ Services & Networking ]                                       │
│   Axios Client (BaseURL, Bearer Interceptor, Network Error Map)   │
└───────────────────────────┬───────────────────────────────────────┘
                            │  HTTPS / HTTP REST API
┌───────────────────────────▼───────────────────────────────────────┐
│                      BACKEND SERVER (EXPRESS)                     │
│                                                                   │
│   [ Middleware Layer ]                                            │
│   CORS ──► BodyParser (50MB) ──► Multer (Memory) ──► Auth / Admin │
│                           │                                       │
│   [ Routing & Controllers ]                                       │
│   /api/auth ──► /api/products ──► /api/orders ──► /api/upload     │
│                           │                                       │
│   [ Service & Business Logic Layer ]                              │
│   auth.service ──► order.service ──► payment.service (Mongoose TX)│
│            │                                                      │
│            ▼                                                      │
│   cloudinary.service (Stream Upload & Secure URL Resolution)      │
│                           │                                       │
│   [ Data Access Layer (Mongoose) ]                                │
│   User Model ◄────► Product Model ◄────► Order Model              │
│                           │                                       │
│   [ Primary Cloud Storage Engine ]                                │
│   MongoDB Atlas & Cloudinary CDN (`shopease/products`)            │
│   (Local disk `/uploads/` retained for legacy seeded asset fallback)│
└───────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites & Minimum Android Version

### Development Environment Prerequisites
- **Node.js**: v20.x, v22.x, or v25.x LTS
- **Package Manager**: `npm` (v10+)
- **Git**: Installed and configured
- **Development Tooling**: Android Studio (with Android SDK) or physical Android device
- **Database**: MongoDB Atlas free tier cluster (or local MongoDB deployment supporting replica sets for transactions)
- **Media Storage**: Cloudinary account (Free tier)

### Android Version & SDK Targeting
- **Minimum Android Version**: **Android 7.0 (API Level 24, Nougat)**
  *(Configured via `minSdk: 24` in `mobile/android/app/build.gradle` and Expo SDK 58)*
- **Target Android SDK**: **API Level 36 (Android 16)**
- **Compile Android SDK**: **API Level 37**
  *(Specifies the Android API level used by the build toolchain and Android Gradle Plugin to compile the application)*

---

## Environment Configuration & Variables

> [!IMPORTANT]
> **Zero-Secret Commitment**: No real secrets, passwords, database credentials, or private keys are committed to Git. All configuration files use placeholder templates only.

### 1. Backend Environment Variables (`backend/.env`)

Copy the template from [backend/.env.example](file:///c:/ecommerce-app/backend/.env.example):

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example / Placeholder |
|---|---|---|
| `PORT` | Backend HTTP listening port | `5000` |
| `NODE_ENV` | Application runtime environment | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string (replica set required for transactions) | `mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used for signing session JWTs (min 32 chars) | `your_jwt_secret_key_here_min_32_characters` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for persistent product media | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_cloudinary_api_secret` |

### 2. Mobile Environment Variables (`mobile/.env`)

Copy the template from [mobile/.env.example](file:///c:/ecommerce-app/mobile/.env.example):

```bash
cp mobile/.env.example mobile/.env
```

| Variable | Description | Value / Template |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base REST API endpoint URL | **Live Render Production Backend**: `https://shopease-backend-s8xj.onrender.com/api`<br>**Physical Device on Local Wi-Fi**: `http://<YOUR_COMPUTER_LAN_IP>:5000/api`<br>**Android Studio Emulator**: `http://10.0.2.2:5000/api` |

#### Finding Your Computer's LAN IP Address (For Local Testing)
- **Windows**: Run `ipconfig` in PowerShell and locate `IPv4 Address` under your active Wi-Fi or Ethernet adapter (e.g. `192.168.1.14`).
- **macOS / Linux**: Run `ifconfig` or `ip addr show` (e.g. `192.168.1.14`).
- Ensure both your computer and Android mobile device are connected to the same Wi-Fi network.

---

## Live Production Deployment & Health Endpoint

The ShopEase backend is deployed on Render and connected to a MongoDB Atlas cluster and Cloudinary media storage.

- **Production API Base URL**: `https://shopease-backend-s8xj.onrender.com/api`
- **Health Check Endpoint**: `https://shopease-backend-s8xj.onrender.com/api/health`

### Verifying Production Health
```bash
curl https://shopease-backend-s8xj.onrender.com/api/health
```

Expected Response:
```json
{
  "success": true,
  "message": "E-Commerce API is running",
  "timestamp": "2026-11-15T18:00:00.000Z"
}
```

---

## Evaluator Demo Credentials & Verification

The release APK is pre-configured to communicate with the live production backend on Render (`https://shopease-backend-s8xj.onrender.com/api`). Evaluators can log in immediately with the verified credentials below or register a fresh customer account:

| Account Role | Email Address | Password | Privileges & Accessible Features |
|---|---|---|---|
| **Administrator** *(Pre-Configured & Verified)* | `test@example.com` | `Test12345` | Full access to Admin Dashboard, Cloudinary product creation and editing, image deletion, live customer orders feed, real-time debounced order search, and status filtering (`PENDING`, `CONFIRMED`, `FAILED`). |
| **Customer** *(Self-Service Registration)* | *Any valid email* (e.g. `evaluator@example.com`) | *Min 8 characters* (e.g. `Password123!`) | Public product catalog browsing, variant selection, persistent cart, address validation, simulated payment flow, and live order tracking. |

### Evaluation Verification Note
The production admin account has been verified live against the Render deployment:
- **`POST /api/auth/login`**: `200 OK` — Valid JWT session token issued.
- **`GET /api/auth/me`**: `200 OK` — Verified `role: "admin"` confirmed from database profile.
- **`GET /api/orders/admin`**: `200 OK` — Admin authorization guard passed (`requireAdmin`).
- **Security Check (Negative Control)**: Unauthenticated requests to `/api/orders/admin` return `401 Unauthorized`.

> [!TIP]
> **Customer Self-Service Registration**: Evaluators do not need pre-existing customer credentials. Tap **Register** on the mobile app's login screen to create a customer account in seconds. All self-registered users are assigned `role: "customer"` by default.
>
> **Promoting Any Account to Admin**: If evaluating a local backend instance, an account can be promoted to admin using `mongosh`:
> ```javascript
> use ecommerce;
> db.users.updateOne({ email: "your_email@example.com" }, { $set: { role: "admin" } });
> ```

---

## Backend Setup & Database Configuration

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure `backend/.env` with your MongoDB connection string, JWT secret, and Cloudinary credentials.

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

4. Seed the synthetic product catalog:
   ```bash
   npm run seed
   ```
   Output: `Sample products seeded successfully`

5. Verify local health check:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## Running the Application

### 1. Start the Backend Server (Optional if using live Render URL)
```bash
cd backend
npm run dev
```

### 2. Start the Mobile Client
In a separate terminal:
```bash
cd mobile
npx expo start --clear
```

### 3. Launching on Android
- **Physical Device**: Open the **Expo Go** app on your Android device and scan the QR code displayed in the terminal.
- **Android Studio Emulator**: Press `a` in the terminal to launch on a running Android emulator.
- **Standalone Release APK**: See the [Release APK Generation & Installation Guide](#release-apk-generation--installation-guide) below.

---

## Automated Testing & Quality Verification

ShopEase includes comprehensive unit, integration, and security test suites covering both mobile and backend modules.

```text
================================================================================
 TOTAL AUTOMATED TESTS: 147 PASSING (39 SUITES) | 0 FAILURES
================================================================================
 - Backend Tests:  92 passing (25 suites)
 - Mobile Tests:   55 passing (14 suites)
 - TypeScript:     0 errors across both projects
 - Linter:         0 errors
================================================================================
```

### Running Backend Tests (92 Tests across 25 Suites)
```bash
cd backend
npm test
```
**Coverage**:
- Admin role authorization middleware (HTTP 401, 403, expired & forged JWT rejection)
- Admin Order Management API (pagination, status filters, customer isolation)
- Admin Order Search (Order Number, Customer Name, Email, debounced queries)
- Authentication Service (password hashing, duplicate email handling, JWT issuance)
- Order Service (server-side pricing, aggregate variant stock validation)
- Payment Service (atomic stock deduction, idempotency, retry safety)
- Product CRUD Operations (SKU collisions, validation, soft-delete exclusions)
- Product Image Upload & Cloudinary Management (magic bytes detection, MIME normalization, Cloudinary upload stream, secure URL persistence, image deletion, safety reference checks)

### Running Mobile Tests (55 Tests across 14 Suites)
```bash
cd mobile
npm test
```
**Coverage**:
- Admin Orders screen logic (name/email derivation, currency formatting, status classification)
- Search filtering & pagination reset logic
- Cart Store & stock caps across multiple variant combinations
- Checkout address validation (Indian 10-digit mobile phone & 6-digit PIN codes)
- Offline resilience & network timeout recovery
- Acceptance tests: zero cart clearance on payment failure, idempotent retry
- Image URL resolution (Cloudinary HTTPS URLs, legacy relative paths, data/file URIs)
- Client-side image validation (MIME types, extensions, 5MB limit)
- Android/Expo transcoding reconciliation (HEIC/PNG/WEBP transcoded to JPEG)

### TypeScript Typechecks (0 Errors)
```bash
# Backend typecheck
cd backend
npx tsc --noEmit

# Mobile typecheck
cd mobile
node node_modules/typescript/bin/tsc --project tsconfig.json --noEmit
```

### Mobile Linter (0 Errors)
```bash
cd mobile
npm run lint
```

---

## Release APK Generation & Installation Guide

The ShopEase Android release APK is compiled using Expo Continuous Native Generation (CNG) and the local Gradle build tool.

### Building the Release APK Locally

#### Windows (PowerShell)
```powershell
# Set Java Home to Android Studio's bundled JDK (Java 17+)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Navigate to the native android directory
cd mobile\android

# Build the release APK
.\gradlew.bat assembleRelease
```

#### macOS / Linux (Bash / Zsh)
```bash
# Navigate to the native android directory
cd mobile/android

# Build the release APK
./gradlew assembleRelease
```

### Generated APK Artifact
- **Exact Path**: `mobile/android/app/build/outputs/apk/release/app-release.apk`
- **File Size**: Approximately **97 MB** (`101,734,808 bytes` in the current release build)
- **Embedded Configuration**: Embeds the production Render API endpoint (`https://shopease-backend-s8xj.onrender.com/api`) with zero localhost or development fallback IP addresses.

### Installing on a Connected Android Device (ADB)

Ensure your Android device has **USB Debugging** enabled:

1. Verify device connection:
   ```bash
   adb devices
   ```
2. Install the release APK without wiping application data:
   ```bash
   adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
   ```
3. Launch the application:
   ```bash
   adb shell am start -n com.shopease.app/.MainActivity
   ```

### Direct APK Sideloading (Without ADB)

Evaluators installing and testing the APK directly on an Android smartphone:
1. Transfer `app-release.apk` to your phone (via USB file transfer, Google Drive, or browser download).
2. Open the **Files** or **Downloads** app on your phone and tap `app-release.apk`.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and enable **Allow from this source**.
4. Tap **Install**, then tap **Open**.
5. The application will launch and connect directly to the live production backend on Render without needing any local server setup.

### Clean Installation & State Reset

To evaluate the application from a clean state (clearing previously stored tokens, user profile, or cached cart items):
- **Via Android Settings**:
  1. Open Android **Settings** > **Apps** > **ShopEase**.
  2. Tap **Storage & cache**.
  3. Tap **Clear storage** (or **Clear data**).
  4. Launch ShopEase to start from a completely clean onboarding state.
- **Via ADB Command Line**:
  ```bash
  adb shell pm clear com.shopease.app
  ```

---

## Security, Persistence & Offline Resilience

### 1. Minimal Permissions Principle
ShopEase requests only strictly necessary Android permissions:
- `android.permission.INTERNET`: Required for REST API communication and product image loading.
- `android.permission.READ_MEDIA_IMAGES` / `android.permission.READ_EXTERNAL_STORAGE` (`maxSdkVersion="32"`): Required only when an administrator selects product photos from the gallery. Camera and microphone permissions are explicitly removed.

### 2. Hardware-Backed Secure Token Storage
- JWT session tokens are stored using `expo-secure-store`.
- On Android, tokens are encrypted inside the hardware-backed **Android Keystore** and stored in EncryptedSharedPreferences, ensuring they cannot be accessed by other applications.

### 3. Local State Persistence Across Restarts
- Cart state (items, selected variants, quantities) is persisted via Zustand's `persist` middleware backed by `AsyncStorage`.
- Cart contents survive app restarts, background eviction, and device reboots.

### 4. Offline Resilience & Network Error Handling
- Network status is monitored via `@react-native-community/netinfo`.
- When offline or unreachable:
  - An **Offline Mode** banner is displayed on the Profile screen.
  - Cached cart items remain fully viewable.
  - Read-only data remains cached in TanStack Query memory.
  - User-friendly error messages are displayed instead of unhandled crashes.
  - A dedicated **Try Again** action allows one-tap reconnection.

### 5. Acceptance Test Integrity
- **No False Success**: The application never displays an order confirmation or clears the cart locally until the backend verifies payment outcome and returns `CONFIRMED`.
- **Payment Failure Cart Preservation**: If payment fails, cart items are preserved intact so the customer can retry without re-adding items.

---

## Backend REST API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new customer account (default role: `customer`) |
| POST | `/api/auth/login` | Public | Authenticate user and receive JWT session token |
| GET | `/api/auth/me` | Authenticated | Retrieve authenticated user profile and active role |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | Retrieve active products with search, category & pagination |
| GET | `/api/products/:id` | Public | Retrieve product details by ID |
| POST | `/api/products` | Admin Only | Create new product with variants, SKU, price & stock |
| PUT | `/api/products/:id` | Admin Only | Update existing product details, inventory & Cloudinary image URLs |
| DELETE | `/api/products/:id` | Admin Only | Soft-delete product (`isActive: false`) |

### Media Uploads & Cloud Storage

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/upload/images` | Admin Only | Upload product images directly to Cloudinary (`multipart/form-data` with `images` field or Base64, 5MB limit, max 10 images) |
| DELETE | `/api/upload/images` | Admin Only | Delete unreferenced Cloudinary image by `publicId` or URL via JSON body (`{ "publicId": "shopease/products/..." }`) |
| DELETE | `/api/upload/{*publicId}` | Admin Only | Delete unreferenced Cloudinary image via URL wildcard parameter |
| GET | `/uploads/*` | Public | Backward-compatible static media serving for legacy seeded images |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Customer | Create a pending order with database-calculated prices |
| GET | `/api/orders` | Customer | Retrieve order history for authenticated customer |
| GET | `/api/orders/:id` | Authenticated | Retrieve individual order details |
| GET | `/api/orders/admin` | Admin Only | Retrieve all customer orders with debounced search & status filters |
| GET | `/api/orders/admin/:id` | Admin Only | Retrieve complete customer order breakdown for admin |

### Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/payments/process` | Customer | Process simulated payment outcome (`SUCCESS` or `FAILED`) with atomic stock deduction |

---

## Clean Android Installation & Demonstration Walkthrough

Follow these steps to evaluate the application on a clean Android device or emulator:

### Step 1: Initialize Backend & Seed Data
1. Launch the backend server: `cd backend && npm run dev` (or use the deployed Render production backend).
2. Seed sample catalog: `npm run seed`.

### Step 2: Customer Journey Demonstration
1. Open the mobile app.
2. Tap **Register** and create a new customer account.
3. On the **Home** tab, browse popular products and categories with safe-area spacing and status bar clearance.
4. On the **Explore** tab, search for `"Headphones"` and filter by category.
5. Tap a product to open **Product Details**. Select variant options (e.g. Color: `Black`, Size: `M`). Observe stock indicator.
6. Tap **Add to Cart** and navigate to the **Cart** tab. Verify product thumbnail, selected variants, and price calculations. Notice the dynamic cart badge counter on the bottom navigation bar.
7. Proceed to **Checkout**. Enter delivery details. Verify that an invalid 8-digit phone number or 4-digit PIN is blocked with validation errors.
8. Enter a valid 10-digit Indian phone number (e.g. `9876543210`) and valid 6-digit PIN code (e.g. `560001`). Tap **Continue to Payment**.
9. **Simulate Payment Failure**: Select `FAILED` outcome. Verify that the order fails gracefully, an error banner is displayed, and cart items remain intact for retry.
10. **Simulate Payment Success**: Select `SUCCESS` outcome. Verify order confirmation screen, cart clearance, and atomic stock reduction in MongoDB.
11. Navigate to the **Orders** tab to inspect the confirmed order receipt.

### Step 3: Administrator Demonstration
1. Log in with the pre-configured evaluator admin credentials:
   - **Email**: `test@example.com`
   - **Password**: `Test12345`
2. Navigate to **Profile** and observe the `ADMIN` badge.
3. Tap **Admin Dashboard**:
   - Tap **Product Management**: View active products, tap **Add Product**, select gallery photos, inspect preview thumbnails, remove an image, fill details, and submit. Uploaded images are stored persistently in Cloudinary.
   - Tap **Orders**: View all customer orders. Test real-time debounced search by typing customer name, email, or order number. Switch filter pills between `ALL`, `PENDING`, `CONFIRMED`, `FAILED`.

### Step 4: Offline Resilience Demonstration
1. Put the mobile device in Airplane Mode (or stop the backend server).
2. Observe the **Offline Mode** indicator on the Profile screen.
3. Verify that the application does not crash and displays friendly retry buttons.
4. Re-enable network connectivity and tap **Try Again** to restore real-time synchronization.

---

## Known Limitations

To maintain a robust, reliable, and test-covered MVP within the assessment timeline, the following features are intentionally out of scope:

1. **Simulated Payment Gateway**: Payments are processed via a two-phase simulated sandbox workflow (`SUCCESS` / `FAILED`) to satisfy evaluation requirements without charging actual bank accounts. No commercial payment gateway (e.g. Razorpay or Stripe) is connected. *(Verified in `backend/src/controllers/payment.controller.ts` & `backend/src/services/payment.service.ts`)*.
2. **Cash on Delivery (COD)**: Checkout currently operates exclusively on the electronic payment simulation workflow; Cash on Delivery order creation is not implemented. *(Verified in `mobile/src/app/checkout.tsx`)*.
3. **Password Self-Recovery**: Automated email password reset (`/forgot-password`) is not implemented; password storage and validation are handled securely via bcrypt with 12 salt rounds. *(Verified in `backend/src/routes/auth.routes.ts`)*.
4. **Push Notifications**: Live delivery status push notifications (e.g. Firebase Cloud Messaging or Expo Push Notifications) are not connected; order status updates are retrieved dynamically via REST APIs with pull-to-refresh. *(Verified in `mobile/src/app/(tabs)/orders.tsx`)*.
5. **Customer Order Cancellation**: Customers cannot cancel confirmed orders post-payment; order status modifications (`PENDING`, `CONFIRMED`, `FAILED`) are managed administratively via the Admin Orders portal. *(Verified in `mobile/src/app/order-details.tsx`)*.

---

## Project Directory Structure

```text
ecommerce-app/
│
├── mobile/                                 # React Native / Expo Android Client
│   ├── assets/
│   │   └── images/
│   │       └── tabIcons/                   # High-definition bottom navigation tab icons (1x, 2x, 3x)
│   ├── src/
│   │   ├── __tests__/                      # Automated Mobile Test Suites (55 tests)
│   │   │   ├── setup.ts                    # In-memory AsyncStorage & SecureStore mocks
│   │   │   ├── cart-store.test.ts          # Cart & aggregate stock limit validation
│   │   │   ├── checkout-validation.test.ts # Address, PIN & Indian phone validation
│   │   │   ├── payment-acceptance.test.ts  # Acceptance tests: server verification & retry
│   │   │   ├── offline-resilience.test.ts  # Offline resilience & timeout recovery
│   │   │   ├── admin-orders.test.ts        # Admin order listing, search & status filters
│   │   │   └── product-images.test.ts      # URL resolution, MIME validation & transcoding
│   │   ├── app/                            # Expo Router Screen Definitions
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx               # Product discovery & category browsing
│   │   │   │   ├── explore.tsx             # Product search & category filters
│   │   │   │   ├── cart.tsx                # Cart management & thumbnail display
│   │   │   │   ├── orders.tsx              # Customer order history & live status
│   │   │   │   ├── profile.tsx             # Profile, offline mode indicator & logout
│   │   │   │   └── _layout.tsx
│   │   │   ├── login.tsx                   # Customer/Admin login screen
│   │   │   ├── register.tsx                # Customer registration screen
│   │   │   ├── admin.tsx                   # Admin management dashboard
│   │   │   ├── admin-orders.tsx            # Admin orders feed with search & status filters
│   │   │   ├── admin-order-details.tsx     # Admin order breakdown & customer info
│   │   │   ├── admin-add-product.tsx       # Admin product creation & gallery picker
│   │   │   ├── admin-edit-product.tsx      # Admin product edit & image manager
│   │   │   ├── product-details.tsx         # Product details & image thumbnail strip
│   │   │   ├── checkout.tsx                # Shipping address & order review
│   │   │   ├── payment.tsx                 # Payment method & simulation options
│   │   │   ├── payment-processing.tsx      # Payment processing status spinner
│   │   │   ├── payment-success.tsx         # Verified confirmation & cart clear
│   │   │   ├── payment-failure.tsx         # Failure handling, cart preserve & retry
│   │   │   ├── order-details.tsx           # Customer detailed order receipt
│   │   │   └── _layout.tsx                 # Protected route navigation guard
│   │   ├── components/                     # Reusable UI Components
│   │   │   ├── ProductCard.tsx             # Product display card with image
│   │   │   ├── ProductImage.tsx            # Image component with error fallback
│   │   │   ├── ScreenHeader.tsx            # Reusable safe-area aware screen header
│   │   │   ├── TabIcon.tsx                 # Vector-style tab icons with cart item counter
│   │   │   └── app-tabs.tsx                # Custom safe-area bottom tab bar
│   │   ├── constants/
│   │   │   └── theme.ts                    # ShopEase design tokens (Colors, Spacing, Typography)
│   │   ├── hooks/                          # React Query Custom Hooks
│   │   │   ├── use-products.ts             # Products query hook
│   │   │   └── use-orders.ts               # Orders query hook
│   │   ├── services/                       # API & Network Services
│   │   │   ├── api.ts                      # Axios instance with JWT interceptor
│   │   │   ├── auth.service.ts             # Authentication API service
│   │   │   ├── product.service.ts          # Product catalog & CRUD API service
│   │   │   ├── order.service.ts            # Customer & admin order API service
│   │   │   └── image-upload.service.ts     # Gallery picker & FormData upload service
│   │   └── store/                          # Zustand State Stores
│   │       ├── cart-store.ts               # Persistent shopping cart store
│   │       ├── auth.store.ts               # Authenticated session & role store
│   │       └── order-store.ts              # Temporary checkout order store
│   ├── .env.example                        # Template for mobile environment variables
│   ├── app.json                            # Expo application configuration & plugins
│   └── package.json                        # Mobile dependencies & test runner script
│
├── backend/                                # Node.js / Express REST API Server
│   ├── src/
│   │   ├── __tests__/                      # Automated Backend Test Suites (92 tests)
│   │   │   ├── admin.authorization.test.ts # Admin role access, customer 403 & JWT checks
│   │   │   ├── admin.order.test.ts         # Admin orders, search, status filters & security
│   │   │   ├── auth.middleware.test.ts     # Bearer token verification & 401 handling
│   │   │   ├── auth.service.test.ts        # Registration, hashing & JWT generation
│   │   │   ├── order.service.test.ts       # Server pricing, stock & variant validation
│   │   │   ├── payment.service.test.ts     # Atomic stock deduction & idempotency
│   │   │   ├── product.crud.test.ts        # Product CRUD, validation & soft delete
│   │   │   └── product.image.test.ts       # Signature detection, Cloudinary uploads & cleanup
│   │   ├── config/
│   │   │   └── database.ts                 # MongoDB Mongoose connection manager
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts          # Registration, login & profile (/me) endpoints
│   │   │   ├── product.controller.ts       # Public catalog & admin CRUD endpoints
│   │   │   ├── order.controller.ts         # Customer orders & admin order search
│   │   │   ├── payment.controller.ts       # Payment simulation outcome dispatcher
│   │   │   └── upload.controller.ts        # Cloudinary upload, delete & signature validator
│   │   ├── data/
│   │   │   └── products.ts                 # Sample synthetic product catalog
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # JWT verification & customer context
│   │   │   └── admin.middleware.ts         # Role-based admin access guard
│   │   ├── models/
│   │   │   ├── user.model.ts               # User schema with role enum
│   │   │   ├── product.model.ts            # Product schema with variants & images
│   │   │   └── order.model.ts              # Order schema with address & items
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              # Authentication routes (/register, /login, /me)
│   │   │   ├── product.routes.ts           # Product catalog routes
│   │   │   ├── order.routes.ts             # Order & admin order routes
│   │   │   ├── payment.routes.ts           # Payment processing routes
│   │   │   └── upload.routes.ts            # Cloudinary upload & delete routes
│   │   ├── services/
│   │   │   ├── auth.service.ts             # User registration & token signing
│   │   │   ├── cloudinary.service.ts       # Cloudinary streaming upload & deletion service
│   │   │   ├── order.service.ts            # Order creation & total calculation
│   │   │   └── payment.service.ts          # Transactional payment processing
│   │   ├── app.ts                          # Express app configuration & static routes
│   │   ├── server.ts                       # HTTP server entrypoint
│   │   └── seed.ts                         # Database seeding utility
│   ├── uploads/
│   │   └── products/                       # Legacy static product image fallback directory
│   ├── .env.example                        # Template for backend environment variables
│   ├── .gitignore                          # Git ignore rules (uploads & env ignored)
│   └── package.json                        # Backend dependencies & test scripts
│
├── docs/                                   # Evaluator technical specifications & testing evidence
│   ├── diagrams/                           # Application architecture & ERD Mermaid diagrams
│   ├── sample-data/                        # Synthetic JSON datasets (products, users, orders)
│   ├── test-evidence/                      # Freshly executed test evidence & test suite logs
│   ├── API_DOCUMENTATION.md                # Comprehensive REST API specifications
│   ├── API_TESTING.md                      # Repeatable curl commands for all endpoints
│   ├── CLEAN_INSTALL_AND_BUILD.md          # Clean clone, run, and APK build guide
│   ├── TECHNICAL_NOTE.md                   # Evaluator technical note on storage, A11y & release
│   └── TESTING.md                          # Quality assurance & reproduction guide
│
├── .gitignore                              # Root repository ignore rules
├── AGENTS.md                               # Project development guidelines
├── LICENSE                                 # MIT License
├── README.md                               # Comprehensive documentation & audit guide
└── requirements.docx                       # Original assessment brief
```

---

## AI Usage, Attribution & Submission Declarations

**Candidate**: Dikshit Nath<br>
**Internship Role**: Android & Mobile App Development<br>
**Assessment Organization**: ALGIONS AI LABS PRIVATE LIMITED<br>
**Assigned Project**: E-Commerce Shopping Android Application (ShopEase)

## AI Usage and Attribution

In accordance with ALGIONS AI LABS submission expectations, AI tools were used as development assistants during the implementation, testing, debugging, and documentation of ShopEase.

- **ChatGPT (OpenAI):** Used during the initial development phase for architectural brainstorming, user journey planning, requirement analysis, technical guidance, and debugging assistance.

- **Antigravity (Google DeepMind):** Used as an AI-assisted development environment for:
  - Assisting with the development and refinement of unit and integration tests (92 backend tests and 55 mobile tests).
  - Reviewing TypeScript code through strict type-checking (`tsc --noEmit`) and assisting with ESLint configuration.
  - Assisting with Cloudinary streaming memory upload implementation and binary image signature (magic-byte) verification.
  - Debugging and improving Android safe-area handling, keyboard input behavior, and bottom navigation styling.
  - Assisting with Gradle release APK build execution (`.\gradlew.bat assembleRelease`) and physical Android device testing through ADB.
  - Verifying production API connectivity and authentication on Render.
  - Reviewing and improving project documentation.

### Developer Responsibility and Verification

AI tools were used to assist the development process, not replace developer understanding or responsibility. Generated suggestions and code were reviewed, integrated, and tested as part of the project workflow. I take responsibility for the submitted implementation and can explain its architecture, functionality, technical decisions, and limitations.

### Declarations
- **Code Ownership & Understanding**: All mobile screens, state stores, backend routes, services, and tests are thoroughly understood and ready to be explained during the technical walkthrough and live debugging session.
- **Zero Real Secrets**: No live payment credentials, personal user data, private JWT keys, or MongoDB/Cloudinary passwords are committed to version control.
- **Link & Endpoint Integrity**: All links, endpoints, test commands, and build scripts have been validated.

---

## Author

**Dikshit Nath**<br>
Full Stack Developer | React Native | Node.js | TypeScript
