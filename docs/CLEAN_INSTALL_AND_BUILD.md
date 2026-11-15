# ShopEase Clean Installation & Android Build Guide

**Organization**: ALGIONS AI LABS PRIVATE LIMITED
**Role**: Android & Mobile Development Internship
**Project**: ShopEase E-Commerce Android Application

---

## Overview

This guide provides step-by-step, reproducible instructions for evaluators who have cloned the repository and wish to:
1. Run the Node.js/Express backend locally.
2. Run the Expo / React Native mobile client in development mode.
3. Build a standalone Android release APK from source.
4. Verify core features on an Android emulator or physical device.

---

## 1. Prerequisites & Version Verification

Ensure the following runtimes and SDKs are installed before proceeding.

### 1.1 Required Toolchain

| Tool | Required Version | Verification Command | Description |
|---|---|---|---|
| **Node.js** | v20.x or v22.x LTS (tested up to v25) | `node -v` | JavaScript runtime |
| **npm** | v10.x or newer | `npm -v` | Node package manager |
| **Java JDK** | OpenJDK 17 (Java 17) | `javac -version` and `java -version` | Required by Android Gradle Plugin 8.x |
| **Android SDK** | Platforms 34 / 35 / 36, Build-Tools 35.0.0+ | `adb version` | Required for native Android compilation |
| **Git** | v2.30+ | `git --version` | Version control |

### 1.2 Environment Variables for Native Android Builds
Ensure `JAVA_HOME` and `ANDROID_HOME` are set in your shell environment:

#### Windows PowerShell
```powershell
# Verify Java 17
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.12.7-hotspot" # Or your JDK 17 path
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Verify Android SDK
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path
```

#### macOS / Linux
```bash
# Verify Java 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17) # macOS
# export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64" # Ubuntu/Debian
export PATH="$JAVA_HOME/bin:$PATH"

# Verify Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk" # macOS
# export ANDROID_HOME="$HOME/Android/Sdk" # Linux
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

---

## 2. Repository Setup & Dependency Installation

Clone the repository and install dependencies in the required order.

```bash
git clone https://github.com/DikshitNath/ecommerce-app.git
cd ecommerce-app
```

### Dependency Installation Order Notice
> [!IMPORTANT]
> **Install backend dependencies before running mobile tests.**
> The mobile project's test runner script (`npm test --prefix mobile`) shares the TypeScript execution engine (`tsx`) installed in `backend/node_modules`. Always install backend dependencies first.

#### Windows PowerShell
```powershell
# 1. Install backend dependencies
Set-Location backend
npm install

# 2. Install mobile dependencies
Set-Location ..\mobile
npm install

# 3. Return to root
Set-Location ..
```

#### macOS / Linux
```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install mobile dependencies
cd ../mobile && npm install

# 3. Return to root
cd ..
```

---

## 3. Environment Configuration

The repository provides `.env.example` templates in both `backend/` and `mobile/`. Never commit real secrets or production `.env` files.

### 3.1 Backend Environment Configuration (`backend/.env`)

Copy the template:
- **Windows PowerShell**: `Copy-Item backend\.env.example backend\.env`
- **macOS / Linux**: `cp backend/.env.example backend/.env`

Configure the variables:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local Replica Set)
# Required for Mongoose models and transactions (session.withTransaction).
# Standalone local MongoDB without replica sets does NOT support transactions.
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority

# JWT Authentication
# Minimum 32-character random string for signing access tokens
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (Optional for general shopping; required only for Admin image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3.2 Mobile Environment Configuration (`mobile/.env`)

Copy the template:
- **Windows PowerShell**: `Copy-Item mobile\.env.example mobile\.env`
- **macOS / Linux**: `cp mobile/.env.example mobile/.env`

Configure `EXPO_PUBLIC_API_URL` based on your evaluation target:

```ini
# Option A: Live Production Cloud Backend (Zero local backend setup required)
EXPO_PUBLIC_API_URL=https://shopease-backend-s8xj.onrender.com/api

# Option B: Android Studio Emulator accessing Local Backend
# (10.0.2.2 is Android's standard alias to your host computer's 127.0.0.1)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api

# Option C: Physical Android Device accessing Local Backend on same Wi-Fi
# (Replace with your computer's local Wi-Fi IPv4 address e.g. 192.168.1.50)
# EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api
```

---

## 4. Backend Setup & Execution

### 4.1 Seed Database (Optional / First Run)
The seed script inserts 3 initial products into MongoDB (`backend/src/data/products.ts`). It uses `upsert: true` and `$setOnInsert` so it is safe to run repeatedly without creating duplicates.

```bash
npm run seed --prefix backend
```

### 4.2 Start Development Backend Server
```bash
npm run dev --prefix backend
```
The server will start on `http://localhost:5000`.

### 4.3 Verify Backend Health
Test reachability in a separate terminal:
```bash
curl http://localhost:5000/api/health
```
**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "E-Commerce API is running",
  "timestamp": "..."
}
```

### 4.4 Evaluator Accounts
- **Self-Registration**: Evaluators can register a new customer account directly from the mobile app's Sign Up screen or via `POST /api/auth/register`.
- **Verified Production Admin Account**: A pre-verified evaluation administrator account exists on the live Render production backend for testing admin product and order feeds:
  - **Email**: `test@example.com`
  - **Password**: `Test12345`

---

## 5. Mobile Development Setup (Expo Metro)

### 5.1 Start the Expo Development Server
```bash
cd mobile
npx expo start
```

### 5.2 Launch on Device or Emulator
- **Android Emulator**: Ensure an Android Virtual Device (AVD) is running in Android Studio, then press **`a`** in the terminal running Expo, or execute:
  ```bash
  cd mobile
  npx expo run:android
  ```
- **Physical Device**: Connect device via USB, enable **USB Debugging** in Developer Options, verify authorization via `adb devices`, and run `npx expo run:android`.

---

## 6. Standalone Android Release APK Build

ShopEase uses **Expo Continuous Native Generation (CNG)**. The `mobile/android/` native folder is excluded from Git tracking and is generated dynamically from `app.json` configuration plugins.

### 6.1 Generate Native Android Project (Prebuild)
Execute the Expo prebuild command to generate the `mobile/android` project from `mobile/app.json`:

```bash
cd mobile
npx expo prebuild --platform android
```
This generates `mobile/android/` configured with package name `com.shopease.app` and native dependencies (`expo-secure-store`, `expo-image-picker`).

### 6.2 Compile Standalone Release APK
Build the release binary using Gradle:

#### Windows PowerShell
```powershell
Set-Location android
.\gradlew assembleRelease
Set-Location ..
```

#### macOS / Linux
```bash
cd android
./gradlew assembleRelease
cd ..
```

### 6.3 Compiled APK Artifact Location
Upon successful build (`BUILD SUCCESSFUL`), the release APK is located at:
```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```
- **Package Name**: `com.shopease.app`
- **File Size**: ~61.5 MB
- **Compile SDK**: 37 (Android compile-time API)
- **Target SDK**: 36 (Android 16)
- **Min SDK**: 24 (Android 7.0 Nougat)

### 6.4 Install the Release APK

#### Method A: Via Android Debug Bridge (ADB)
Ensure device or emulator is connected:
```bash
# Check device connectivity
adb devices

# Install release APK (-r replaces existing install while keeping data)
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk

# Launch the application
adb shell monkey -p com.shopease.app 1
```

#### Method B: Manual Sideloading
1. Transfer `app-release.apk` to your Android device via USB cable, Google Drive, or local storage.
2. Open your device's **Files** app and tap `app-release.apk`.
3. When prompted, permit your file manager to **Install Unknown Apps** in Android Settings.
4. Tap **Install** and launch **ShopEase** from your home screen.

### 6.5 APK Signing Status Notice
> [!NOTE]
> **Evaluator Signing Configuration**:
> The `release` build type in `mobile/android/app/build.gradle` is configured with `signingConfig signingConfigs.debug`. This allows evaluators to install and test the release APK immediately without needing a proprietary signing key.
> **For Google Play Store Release**: A custom production keystore (`upload-keystore.jks`) and matching signing credentials must be configured in `android/app/build.gradle` or managed via EAS Build before generating an Android App Bundle (`.aab`).

---

## 7. Clean Installation Verification Protocol

Follow this checklist to verify a clean installation:

1. **Clean Slate**:
   Uninstall any previous version to ensure a fresh database and storage test:
   ```bash
   adb uninstall com.shopease.app
   ```
2. **Install & Launch**:
   Install `app-release.apk` via ADB or sideloading, then open the app. Verify the blue splash screen displays and transitions to the Home catalog.
3. **Product Catalog**:
   Verify product cards display titles, prices in ₹, stock counts, and thumbnail images loaded from Cloudinary CDN. Test search and category filtering pills.
4. **Product Details & Variants**:
   Tap a product (e.g. shoes). Select variant options (Size, Color). Verify variant selection updates state.
5. **Offline Cart Persistence**:
   Add items with specific variants to your cart. Close the app completely (`adb shell am force-stop com.shopease.app`). Relaunch the app. Navigate to the Cart tab; verify all items and selected variant combinations are retained from `AsyncStorage`.
6. **Checkout & Address Validation**:
   Proceed to Checkout. Attempt submission with invalid fields. Verify validation rules reject incomplete addresses, non-10-digit phone numbers, or invalid 6-digit PIN codes.
7. **Simulated Payment Testing**:
   - **Test Payment Failure**: On the Payment screen, select **Failure**. Confirm the app transitions to the Payment Failure screen. Return to Cart; **verify items are strictly preserved in your cart so you can retry**.
   - **Test Payment Success**: Re-attempt payment and select **Success**. Confirm the app displays the Payment Success screen with the confirmed Order ID. Verify your cart is now cleared.
8. **Customer Order History**:
   Navigate to the Orders tab. Verify your newly confirmed order displays with `CONFIRMED` badge and populated order items.
9. **Offline Error Resilience**:
   Toggle Airplane Mode on your device. Navigate between screens. Verify the app renders cached views without unhandled crashes, displaying an informative offline status banner.

---

## 8. Troubleshooting Common Issues

### 8.1 Backend Cold Starts on Render
- **Symptom**: First request to `https://shopease-backend-s8xj.onrender.com/api` takes 30–50 seconds or times out.
- **Cause**: Render free tier instances spin down after inactivity.
- **Solution**: Send a preliminary probe to `https://shopease-backend-s8xj.onrender.com/api/health` in your browser. Once it responds `200 OK`, the server is active.

### 8.2 Android Emulator Cannot Connect to Local Backend
- **Symptom**: `Network Error` or `AxiosError: timeout of 10000ms exceeded`.
- **Cause**: Inside an Android emulator, `localhost` points to the emulator itself, not your host computer.
- **Solution**: Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api` in `mobile/.env`.

### 8.3 Physical Device Cannot Connect to Local Backend
- **Symptom**: Physical phone cannot load products from local computer.
- **Cause**: Device and computer are on different Wi-Fi networks, or computer firewall blocks port 5000.
- **Solution**:
  1. Ensure phone and computer share the same Wi-Fi network.
  2. Use computer LAN IP: `EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api`.
  3. Ensure Windows Defender / macOS Firewall permits incoming connections on port 5000.
  4. Alternatively, point mobile to the live Render backend (`https://shopease-backend-s8xj.onrender.com/api`).

### 8.4 Gradle Build Fails with Java Version Error
- **Symptom**: `Unsupported class file major version` or Gradle daemon initialization failure.
- **Cause**: An incompatible or outdated Java version (e.g., Java 8, Java 11, or an unsupported early-access JDK build) is active in `JAVA_HOME`.
- **Solution**: Set `JAVA_HOME` to OpenJDK 17 LTS (the officially recommended baseline for Expo SDK 54 and React Native 0.76):
  ```powershell
  $env:JAVA_HOME = "C:\path\to\jdk-17" # Windows
  ```
  Verify with `java -version`. Note: Gradle 9.4.1 wrapper bundled with the project supports Java 17 through Java 21; ensure your active JDK matches your installed Gradle runtime.

### 8.5 MongoDB Transaction Error on Local Backend
- **Symptom**: `Transaction numbers are only allowed on a replica set member or mongos`.
- **Cause**: Local MongoDB is running as a standalone node rather than a replica set.
- **Solution**: Use MongoDB Atlas free tier (which runs as a replica set by default) and paste the connection string into `backend/.env`.

---

## 9. Security & Clean Repository Policy

1. **No Credentials in Version Control**: `.env` files are ignored via `.gitignore`. Never commit `.env` containing connection strings or secrets.
2. **Evaluation API URL**: The production Render URL (`https://shopease-backend-s8xj.onrender.com/api`) is a public REST gateway and safe to embed in evaluation builds.
3. **Simulated Payment Sandbox**: ShopEase deliberately does not collect real credit cards or invoke live banking gateways. The payment flow is an evaluation simulation designed to test stock deduction and state consistency safely.
