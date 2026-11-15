# ShopEase – E-Commerce Android Mobile Application

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
7. [Backend Setup & Database Configuration](#backend-setup--database-configuration)
8. [Product Seeding & Test Accounts](#product-seeding--test-accounts)
9. [Running the Application](#running-the-application)
10. [Automated Testing & Quality Verification](#automated-testing--quality-verification)
11. [Release APK Generation & Installation Guide](#release-apk-generation--installation-guide)
12. [Security, Persistence & Offline Resilience](#security-persistence--offline-resilience)
13. [Backend REST API Endpoints](#backend-rest-api-endpoints)
14. [Clean Android Installation & Demonstration Walkthrough](#clean-android-installation--demonstration-walkthrough)
15. [Known Limitations](#known-limitations)
16. [Project Directory Structure](#project-directory-structure)

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

4. Verify local health check:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## Product Seeding & Test Accounts

### 1. Seeding Sample Products
The backend includes a dedicated seeding script that populates the database with synthetic catalog data (complete with variants, pricing, inventory, categories, and image URLs):

```bash
cd backend
npm run seed
```

Output:
```text
Sample products seeded successfully
```

### 2. Creating Test Accounts

Real passwords are never hardcoded or committed to version control.

#### A. Customer Account (Self-Service)
1. Launch the mobile application.
2. Tap the **Register** link on the login screen.
3. Enter your desired test details (e.g. Name: `Test Customer`, Email: `customer@example.com`, Password: `Password123!`).
4. Tap **Register**. Passwords are encrypted using bcrypt (12 salt rounds) and the account is created with default `role: "customer"`.

#### B. Administrator Account (Secure Promotion)
ShopEase prevents public registration from granting admin privileges. To create an admin account:

1. Register an account using the normal registration flow (e.g. Email: `admin@example.com`, Password: `AdminPassword123!`).
2. Promote the user's role to `"admin"` directly in MongoDB:
   - **Using MongoDB Shell (`mongosh`)**:
     ```javascript
     use ecommerce;
     db.users.updateOne(
       { email: "admin@example.com" },
       { $set: { role: "admin" } }
     );
     ```
   - **Using MongoDB Atlas / Compass UI**:
     Navigate to the `users` collection, locate the document for `admin@example.com`, and update the field `"role": "admin"`.
3. Log in with this account in the mobile app. The **Profile** screen will display the `ADMIN` badge and the **Admin Dashboard** entry point.

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
1. Promote an account to `"admin"` in MongoDB (`role: "admin"`).
2. Log in with the admin account. Navigate to **Profile** and observe the `ADMIN` badge.
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

1. **Simulated Payment Gateway**: Payments are currently processed via simulated sandbox outcomes (`SUCCESS` / `FAILED`) to fulfill assessment requirements without charging real bank accounts. No live banking gateway (e.g. Razorpay or Stripe) is connected.
2. **Cash on Delivery (COD)**: Checkout currently operates exclusively on the electronic payment workflow; Cash on Delivery order handling is not implemented.

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
├── .gitignore                              # Root repository ignore rules
├── AGENTS.md                               # Project development guidelines
├── LICENSE                                 # MIT License
├── README.md                               # Comprehensive documentation & audit guide
└── requirements.docx                       # Original assessment brief
```

---

## Author

**Dikshit Nath**<br>
Full Stack Developer | React Native | Node.js | TypeScript
