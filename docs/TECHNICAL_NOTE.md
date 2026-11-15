# ShopEase Technical Implementation Note

**Organization**: ALGIONS AI LABS PRIVATE LIMITED
**Role**: Android & Mobile Development Internship
**Project**: ShopEase E-Commerce Android Application
**Platform**: Android (React Native 0.76 / Expo SDK 54 / Android API 24–36)

---

## Executive Summary

This technical note documents the verified engineering design, architecture, security mechanisms, state persistence lifecycles, accessibility standards, and release readiness of the ShopEase Android application. Every statement in this document has been cross-checked and verified directly against the production source code in `mobile/src/`, `mobile/android/`, and `backend/src/`.

---

## 1. Secure Storage & Credential Architecture

ShopEase strictly isolates authentication credentials and cryptographic tokens from general application data using dedicated platform storage mechanisms.

### 1.1 Authentication Token Storage (Expo SecureStore)
- **Status**: Implemented and verified
- **Implementation**: Managed in `mobile/src/store/auth.store.ts` via `expo-secure-store`.
- **Stored Keys**:
  - `auth_token`: Cryptographic JWT session token issued by the backend upon registration or login.
  - `auth_user`: Serialized JSON representation of the sanitized public user profile (`id`, `name`, `email`, `role`).
- **Android Platform Mechanics**: `expo-secure-store` stores data in Android's `EncryptedSharedPreferences` (or KeyStore-backed SharedPreferences depending on Android OS level), encrypted with AES-256.
- **Verification & Limitations**:
  - The implementation uses the default `SecureStore.setItemAsync(key, value)` without passing custom options such as `requireAuthentication: true` (biometrics).
  - Storage is hardware-backed only if the underlying Android device supports and exposes a hardware KeyStore (TEE); hardware backing or StrongBox is not guaranteed across all budget Android hardware.

### 1.2 Non-Sensitive Client Storage (AsyncStorage)
- **Status**: Implemented and verified
- **Implementation**: Utilizes `@react-native-async-storage/async-storage` via Zustand's `persist` middleware.
- **Persisted Keys & Data**:
  1. `shopping-cart-storage` (`mobile/src/store/cart-store.ts`): Stores cart line items (`id`, `name`, `price`, `description`, `stock`, `images`, `cartItemId`, `selectedVariants`, `quantity`). Uses schema versioning (`version: 2`) with migration support.
  2. `order-history-storage` (`mobile/src/store/order-store.ts`): Stores locally recorded order history entries (`id`, `items`, `subtotal`, `deliveryFee`, `total`, `paymentMethod`, `status`, `createdAt`) for offline client reference.
- **Security Boundary**: **No authentication tokens, passwords, JWT secrets, or payment credentials are stored in AsyncStorage.** AsyncStorage remains unencrypted; restricting it strictly to catalog and cart metadata prevents credential leakage.

### 1.3 JWT Lifecycle & Axios Request Interceptors
- **Status**: Implemented with limitations
- **Implementation**: Configured in `mobile/src/services/api.ts`.
- **Request Interception**:
  ```typescript
  api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```
- **Lifecycle & Limitations**:
  - **Token Injection**: The request interceptor asynchronously reads `auth_token` from `SecureStore` on every outgoing HTTP request and injects it into the `Authorization: Bearer <TOKEN>` header.
  - **No Refresh Token Flow**: The backend issues a single JWT signed with HMAC-SHA256 with an expiration controlled by `JWT_EXPIRES_IN` (defaults to `1h`). There is **no refresh token endpoint or automated token rotation mechanism**.
  - **No Global 401 Interceptor**: `mobile/src/services/api.ts` does not register an Axios response error interceptor to trigger automatic global logout on HTTP 401. Session clearing upon 401 is handled explicitly during `auth.store.ts` `initialize()` and inside individual UI catch blocks.

### 1.4 Password Handling & Server Cryptography
- **Status**: Implemented and verified
- **Backend Hashing**: Managed in `backend/src/services/auth.service.ts` using `bcryptjs` with **12 salt rounds** (`bcrypt.hash(password, 12)`). Plaintext passwords are never written to MongoDB, disk, or logs.
- **Query Projection Guard**: The Mongoose `User` schema (`backend/src/models/user.model.ts`) sets `password: { type: String, required: true, select: false }`. Standard queries (`find()`, `findById()`) omit the password hash unless explicitly requested with `.select("+password")` in `loginUser()`.

---

## 2. State Persistence & App Lifecycle

ShopEase combines in-memory state, disk-persisted state, and server cache synchronization to provide a responsive user experience.

```
┌────────────────────────────────────────────────────────┐
│                   ShopEase Mobile App                  │
├──────────────────────────┬─────────────────────────────┤
│  Zustand Auth Store      │  Zustand Storage Stores     │
│  - Storage: SecureStore  │  - Cart: AsyncStorage       │
│  - Encrypted JWT         │  - Local Orders: AsyncStore │
│  - Cached User Profile   │  - Schema Versioning        │
├──────────────────────────┴─────────────────────────────┤
│  TanStack React Query v5                               │
│  - Global Default: 5 min staleTime, 1 retry            │
│  - Orders Override: 30 sec / 15 sec                    │
└────────────────────────────────────────────────────────┘
```

### 2.1 Zustand Persistence Architecture
- **Status**: Implemented and verified
- **Cart Store (`useCartStore`)**:
  - Uses composite keys (`createCartItemId(productId, variants)`) so distinct variant configurations (e.g., Size 10 vs. Size 11) operate as independent line items while checking total aggregate inventory.
  - Cart state persists to AsyncStorage under key `shopping-cart-storage`.
- **Order Store (`useOrderStore`)**:
  - Persists locally created order snapshots under key `order-history-storage`.

### 2.2 Authentication Startup & Offline Resilience
- **Status**: Implemented and verified
- **Startup Flow (`initialize` in `auth.store.ts`)**:
  1. Reads `auth_token` from `SecureStore`.
  2. If token is absent: purges `auth_user` from `SecureStore` and sets `status: "unauthenticated"`.
  3. If token exists: issues a background call to `GET /api/auth/me`.
  4. **Active Session (200 OK)**: Updates `user` with the fresh database role and profile, writes to `SecureStore`, and sets `status: "authenticated"`.
  5. **Invalid/Expired Session (401 or 404)**: Calls `clearSession()` (deletes `auth_token` and `auth_user` from `SecureStore`) and sets `status: "unauthenticated"`.
  6. **Network Unreachable (Offline Fallback)**: If an Axios error occurs without a 401/404 response (server down or timeout), it calls `getSavedUser()` from `SecureStore`. If cached user data exists, the store sets `user: cachedUser` and `status: "offline"`, preserving the customer's session with an informative warning banner.

### 2.3 React Query Server-Side Caching
- **Status**: Implemented and verified
- **Global Defaults (`mobile/src/app/_layout.tsx`)**:
  ```typescript
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes (300,000 ms)
        retry: 1,
      },
    },
  });
  ```
- **Query Overrides**:
  - **Product Catalog (`useProducts`, `useProduct`)**: Inherits the **5-minute (300,000 ms)** global stale time.
  - **Customer Order History (`useOrders`)**: Explicitly overrides `staleTime: 30 * 1000` (30 seconds).
  - **Admin Orders Feed (`useAdminOrders`)**: Explicitly overrides `staleTime: 15 * 1000` (15 seconds).
  - **Cache Invalidation**: On order creation or payment confirmation, React Query invalidates `orderKeys.all` to force fresh data fetching.

### 2.4 Logout & State Cleanup
- **Status**: Implemented and verified
- **Session Cleanup**: `logout()` in `auth.store.ts` invokes `clearSession()`, executing `SecureStore.deleteItemAsync("auth_token")` and `SecureStore.deleteItemAsync("auth_user")`.
- **In-Memory State**: Resets `user: null`, `status: "unauthenticated"`, and `error: null`.
- **Cart Retention Behavior**: `logout()` **does not clear** `shopping-cart-storage` in AsyncStorage. Items added to the cart remain available across login sessions. The cart is cleared only upon explicit checkout completion (`clearCart()`).

---

## 3. Accessibility (A11y) Implementation & Audit

### 3.1 Implemented & Verified Accessibility Features
- **Semantic Navigation Roles (`mobile/src/components/app-tabs.tsx`)**:
  - Each tab declares `accessibilityRole="tab"`.
  - Dynamic state: `accessibilityState={{ selected: isFocused }}`.
  - Descriptive labels: `accessibilityLabel={descriptor?.options?.tabBarAccessibilityLabel ?? config.label}`.
- **Header Navigation (`mobile/src/components/ScreenHeader.tsx`)**:
  - Back button declares `accessibilityRole="button"` and `accessibilityLabel="Go back"`.
  - Back button visual dimensions are `36×36 pt`, expanded to **`56×56 pt`** effective touch target via `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`.
- **Cart Actions (`mobile/src/app/(tabs)/cart.tsx`)**:
  - Quantity adjusters declare `accessibilityLabel="Decrease quantity"` and `accessibilityLabel="Increase quantity"`.
  - Primary checkout button declares `accessibilityRole="button"` and `accessibilityLabel="Proceed to checkout"`.
- **Keyboard Handling & Form Inputs**:
  - All form screens (`login.tsx`, `register.tsx`, `checkout.tsx`, `admin-add-product.tsx`, `admin-edit-product.tsx`) implement `KeyboardAvoidingView` wrapping a `ScrollView` with `keyboardShouldPersistTaps="handled"`.

### 3.2 Accessibility Limitations & Gaps (Verified Code Facts)
- **Inline Cart Button Touch Targets**: In `cart.tsx`, `quantityButton` is styled with `width: 34, height: 34` without a `hitSlop` expansion. This falls below the recommended 44–48 dp touch target guideline. Primary buttons (`checkoutButton: paddingVertical: 14`) satisfy the >= 48 dp recommendation.
- **Unconsolidated Product Card Elements**: In `ProductCard.tsx`, product title, price, and category are rendered as separate sibling `Text` nodes without an enclosing `accessible={true}` container with a consolidated `accessibilityLabel`.
- **Dynamic Announcements**: Order confirmation toast banners and offline status changes do not invoke `AccessibilityInfo.announceForAccessibility()`.
- **Form Error Focus**: Validation failures in `checkout.tsx` and auth screens render error text but do not programmatically shift accessibility focus to the first invalid input.
- **Audit Scope**: A full WCAG 2.1 AA/AAA compliance audit using Android TalkBack has not been conducted across all device viewports.

---

## 4. Release Readiness & Android Build Specifications

### 4.1 Android SDK & Build Configuration
- **Status**: Implemented and verified

| Parameter | Value | Location | Description |
|---|---|---|---|
| **`minSdkVersion`** | `24` | `mobile/android/app/build.gradle` (via `rootProject.ext`) | Android 7.0 (Nougat) |
| **`targetSdkVersion`** | `36` | `mobile/android/app/build.gradle` (via `rootProject.ext`) | Android 16 |
| **`compileSdkVersion`** | `37` | `mobile/android/app/build.gradle` (via `rootProject.ext`) | Android compile-time API level |
| **Application ID** | `com.shopease.app` | `mobile/android/app/build.gradle` | Unique package namespace |
| **JS Engine** | Hermes | `mobile/android/gradle.properties` (`hermesEnabled=true`) | Bytecode pre-compiled runtime |

### 4.2 Minification, Packaging & Signing
- **Status**: Implemented with limitations
- **R8 Code Shrinking**: Enabled via `android.enableMinifyInReleaseBuilds=true` in `gradle.properties` and configured in `buildTypes.release` (`minifyEnabled enableMinifyInReleaseBuilds`, using `proguard-android-optimize.txt` and `proguard-rules.pro`).
- **Resource Shrinking**: Disabled (`shrinkResources false`).
- **AAPT2 Optimization**: Enabled via `android.enablePngCrunchInReleaseBuilds=true`.
- **Signing Configuration (Limitation)**: In `mobile/android/app/build.gradle`, the `release` build type is currently configured with `signingConfig signingConfigs.debug`. The release APK generated for evaluation is signed with the Android debug keystore. **A custom production keystore (`upload-keystore.jks`) must be configured before publishing to Google Play Console.**

### 4.3 Network Timeout & Health Check Implementation
- **Status**: Implemented and verified
- **Axios Timeout**: Configured at **10,000 ms** (`timeout: 10000` in `mobile/src/services/api.ts`) on the global Axios client instance.
- **Startup Health Probe**:
  - Function: `checkBackendHealth()` in `mobile/src/services/api.ts`.
  - Endpoint: `GET /health` with an explicit **5,000 ms** timeout (`timeout: 5000`).
  - Execution: Called once in `mobile/src/app/_layout.tsx` on root mount. If it fails, the application calls `markBackendOffline()`.

### 4.4 Cloudinary Media Upload Validation
- **Status**: Implemented and verified
- **Upload Constraints (`backend/src/controllers/upload.controller.ts`)**:
  - `MAX_FILE_SIZE`: 5 MB (`5 * 1024 * 1024` bytes).
  - `MAX_IMAGES_COUNT`: 10 images maximum per batch.
  - **Authoritative Binary Magic Bytes Inspection**:
    - **PNG**: `89 50 4E 47`
    - **JPEG**: `FF D8 FF`
    - **GIF**: `47 49 46 38`
    - **WEBP**: `52 49 46 46` ... `57 45 42 50` (`RIFF....WEBP`)
    - **HEIC/HEIF**: Offset 4 `66 74 79 70` (`ftyp`) with brand `heic`, `heix`, `heim`, `heis`, `mif1`, or `msf1`.
  - **Transcoding Reconciliation**: Normalizes Android/Expo photo picker uploads where declared MIME is HEIC/PNG but the native output was compressed as JPEG.
  - **Active Reference Deletion Guard**: `DELETE /api/upload/images` queries MongoDB (`Product.findOne({ images: { $regex: escapedId }, isActive: true })`). Deletion is **blocked with 409 Conflict** if any active product references the image.

### 4.5 Idempotency Architecture
- **Status**: Implemented with limitations
- **Payment Idempotency (Verified)**:
  - In `backend/src/services/payment.service.ts`, if an order is already marked `paymentStatus: "SUCCESS"` and `orderStatus: "CONFIRMED"`, repeated calls to `POST /api/payments/process` immediately return the confirmed order without double-decrementing product inventory.
- **Order Creation (Limitation)**:
  - `POST /api/orders` does not implement an `Idempotency-Key` header. Submitting the checkout form twice will create two distinct pending orders with different order numbers.

### 4.6 Automated Test Suite
- **Status**: Implemented and verified
- **Command**: `npm test --prefix mobile` (executing Node test runner via `tsx`).
- **Current Results**:
  ```text
  ℹ tests 55
  ℹ suites 14
  ℹ pass 55
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ```
- **Coverage**: Covers Admin Orders, Cart Store & Stock Management, Checkout Address Validation, Offline Resilience & Error Recovery, Payment Flow Acceptance Criteria, and Product Image Upload/Display Logic.

---

## 5. Release Readiness Assessment

### 5.1 Verified Strengths
1. **Zero Secret Leakage**: No hardcoded API keys, JWT secrets, or production database passwords in client or backend repositories.
2. **Offline Cart Resilience**: Dual-layer Zustand + AsyncStorage implementation guarantees cart items are preserved through connection drops and app restarts.
3. **Atomic Stock Decrement**: Uses MongoDB session transactions (`session.withTransaction`) to decrement stock atomically upon payment success.
4. **Binary Upload Security**: Validates raw buffer signatures to reject spoofed image extensions before streaming to Cloudinary.
5. **High Unit Test Pass Rate**: 55/55 mobile unit tests passing across all critical business logic domains.

### 5.2 Technical Limitations (Honest Disclosure)
1. **Simulated Payment Workflow**: Payment processing simulates `SUCCESS` and `FAILED` states; it does not connect to a commercial gateway (Razorpay, Stripe) with real card processing.
2. **Debug Keystore Signing**: The release APK is currently signed with Android's debug keystore for testing and evaluation. A custom production release keystore is required for store deployment.
3. **No Refresh Token Flow**: Access tokens expire based on `JWT_EXPIRES_IN` without silent background renewal; expired sessions require re-login.
4. **No Push Notifications**: Firebase Cloud Messaging (FCM) and APNs background services are not configured.

### 5.3 Recommended Future Improvements
1. **Biometric Re-Authentication**: Integrate `expo-local-authentication` to require fingerprint or face unlock before finalizing checkout.
2. **Token Rotation**: Implement HTTP-only refresh tokens or rolling session tokens on the backend with automated Axios response interceptor renewal.
3. **Screen Reader Consolidation**: Add `accessible={true}` and consolidated `accessibilityLabel` formatting on `ProductCard.tsx` items.
4. **Production Keystore Pipeline**: Configure automated release keystore signing in CI/CD (EAS Build or GitHub Actions) to generate Google Play AAB artifacts.
