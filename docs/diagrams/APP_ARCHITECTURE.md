# ShopEase Application Architecture Diagram

This document illustrates the end-to-end architecture of the ShopEase mobile e-commerce platform, covering the React Native client, state management, networking, Express application server, and cloud infrastructure.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    %% CLIENT TIER
    subgraph CLIENT["Client Tier (React Native & Expo Mobile App)"]
        direction TB

        subgraph UI["Presentation Layer"]
            SCREENS["App Screens & Components<br/>(Tabs: Catalog, Cart, Orders, Profile)<br/>(Modals: Checkout, Payment, Admin)"]
            ROUTER["Expo Router (File-Based Navigation)<br/>src/app/_layout.tsx"]
        end

        subgraph STATE["State & Storage Layer"]
            Z_CART["Zustand Cart Store<br/>(useCartStore)"]
            ASYNC_STORE[("AsyncStorage<br/>Local Persistent Cart")]

            Z_AUTH["Zustand Auth Store<br/>(useAuthStore)"]
            SECURE_STORE[("Expo SecureStore<br/>Encrypted JWT & User Data")]

            REACT_QUERY["TanStack React Query v5<br/>(Server State Cache & Invalidation)"]
        end

        subgraph NET_CLIENT["Networking Layer"]
            AXIOS["Axios HTTP Client (src/services/api.ts)<br/>Request Interceptor: Bearer JWT Injection"]
        end

        SCREENS --> ROUTER
        SCREENS <--> Z_CART
        SCREENS <--> Z_AUTH
        SCREENS <--> REACT_QUERY

        Z_CART <--> ASYNC_STORE
        Z_AUTH <--> SECURE_STORE

        REACT_QUERY --> AXIOS
        Z_AUTH --> AXIOS
    end

    %% PROTOCOL / BOUNDARY
    AXIOS -- "HTTPS / JSON REST API<br/>(GET, POST, PUT, DELETE)" --> MIDDLEWARE
    AXIOS -- "Multipart Form-Data<br/>(POST /api/upload/images)" --> MIDDLEWARE

    %% BACKEND TIER (RENDER)
    subgraph SERVER["Backend Server Tier (Render Cloud PaaS)"]
        direction TB

        subgraph MIDDLEWARE["Express Middleware Pipeline"]
            CORS_HELMET["CORS & Helmet Security Headers"]
            JSON_BODY["express.json Body Parser"]
            AUTH_GUARD["authenticate Middleware<br/>(JWT Verification)"]
            ADMIN_GUARD["requireAdmin Middleware<br/>(RBAC Role Verification)"]
            MULTER_MEM["Multer (In-Memory Buffer Storage)"]
        end

        subgraph ROUTERS["API Routes & Controllers (backend/src/)"]
            AUTH_ROUTE["Auth Controller<br/>POST /api/auth/register<br/>POST /api/auth/login<br/>GET /api/auth/me"]
            PROD_ROUTE["Product Controller<br/>GET /api/products<br/>GET /api/products/:id<br/>POST, PUT, DELETE (Admin)"]
            ORDER_ROUTE["Order Controller<br/>POST /api/orders<br/>GET /api/orders<br/>GET /api/orders/admin"]
            PAY_ROUTE["Payment Controller<br/>POST /api/payments/process"]
            UPLOAD_ROUTE["Upload Controller<br/>POST /api/upload/images<br/>DELETE /api/upload/images"]
        end

        subgraph SERVICES["Domain Services Layer"]
            AUTH_SVC["Auth Service<br/>(bcryptjs Hashing & JWT Signing)"]
            PROD_SVC["Product Service<br/>(Catalog Query & Soft Delete)"]
            ORDER_SVC["Order Service<br/>(Stock Check & Price Calculation)"]
            PAY_SVC["Payment Service<br/>(Simulated Payment & Atomic Session Tx)"]
            CLOUD_SVC["Cloudinary Service<br/>(Buffer Magic Bytes Check & Stream)"]
        end

        MIDDLEWARE --> ROUTERS

        AUTH_ROUTE --> AUTH_SVC
        PROD_ROUTE --> PROD_SVC
        ORDER_ROUTE --> ORDER_SVC
        PAY_ROUTE --> PAY_SVC
        UPLOAD_ROUTE --> CLOUD_SVC
    end

    %% DATA TIER
    subgraph DATA_TIER["Cloud Infrastructure Tier"]
        direction TB

        subgraph MONGO_ATLAS["MongoDB Atlas Database"]
            MONGOOSE["Mongoose ODM (Schema & Validation)"]
            COL_USERS[("Users Collection<br/>name, email, role, password")]
            COL_PRODUCTS[("Products Collection<br/>name, sku, price, stock, variants")]
            COL_ORDERS[("Orders Collection<br/>items, address, amounts, statuses")]
        end

        subgraph CDN["Media Storage & Distribution"]
            CLOUDINARY[("Cloudinary Cloud Storage<br/>Folder: shopease/products")]
            FAST_CDN["Cloudinary Global CDN<br/>(Image Delivery & Optimization)"]
        end
    end

    SERVICES --> MONGOOSE
    MONGOOSE --> COL_USERS
    MONGOOSE --> COL_PRODUCTS
    MONGOOSE --> COL_ORDERS

    CLOUD_SVC -- "Cloudinary Node SDK v2 (Upload/Delete)" --> CLOUDINARY
    CLOUDINARY --> FAST_CDN
    FAST_CDN -. "Optimized Image URLs" .-> SCREENS

    %% STYLING
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef server fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef data fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d;
    classDef cdn fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8;

    class CLIENT,UI,STATE,NET_CLIENT client;
    class SERVER,MIDDLEWARE,ROUTERS,SERVICES server;
    class MONGO_ATLAS,COL_USERS,COL_PRODUCTS,COL_ORDERS,MONGOOSE data;
    class CDN,CLOUDINARY,FAST_CDN cdn;
```

---

## 2. Architecture Layer Descriptions

### 1. Presentation & Routing Layer
- **Framework**: React Native with Expo SDK 54, styled via NativeWind / Tailwind CSS.
- **Routing**: Expo Router using file-based navigation conventions (`src/app/`). Tab navigators handle primary customer views (Catalog, Cart, Orders, Profile), and stacked modals handle checkout, payment simulation, product details, and the administrator suite.

### 2. State & Storage Architecture
- **Offline Cart Persistence**: The shopping cart is managed client-side via **Zustand** (`useCartStore`) and persisted locally using **AsyncStorage**. Cart operations require zero network latency, and items are preserved offline and during payment failures.
- **Secure Authentication**: Authentication tokens (JWT) and user identity profiles are stored securely in hardware-backed storage via **Expo SecureStore** (`auth_token`, `auth_user`).
- **Server Cache & Synchronization**: Catalog listings and order records are fetched and cached using **TanStack React Query v5**, providing automatic background refetching and stale-time caching.

### 3. Networking Layer
- **Axios HTTP Client**: Centralized Axios client (`src/services/api.ts`) configured with `EXPO_PUBLIC_API_URL`.
- **JWT Interceptor**: An asynchronous request interceptor retrieves the JWT token from `SecureStore` and automatically injects the `Authorization: Bearer <token>` header for all authenticated requests.

### 4. Express Server & Middleware Pipeline
- **Hosting**: Live cloud deployment on **Render PaaS** with auto-deploy from GitHub.
- **Security Middleware**: `cors` restricts origins, `helmet` applies defense-in-depth HTTP security headers, and `express.json()` parses payloads.
- **Access Control**:
  - `authenticate`: Extracts Bearer token, validates JWT signature against `JWT_SECRET`, and attaches `req.user.userId`.
  - `requireAdmin`: Queries the database to verify `user.role === "admin"`. Non-admin accounts receive `403 Forbidden`.
- **Media Upload**: Uses `multer` with memory storage to validate image buffers and avoid temporary disk storage on ephemeral container instances.

### 5. Services & Business Logic Layer
- **Atomic Checkout & Inventory**: The `order.service.ts` verifies product stock limits, enforces variant selection, and applies fixed `₹40` delivery fees.
- **Simulated Payment Lifecycle**: The `payment.service.ts` simulates payment outcome (`SUCCESS` vs. `FAILED`). Upon `SUCCESS`, it opens an atomic MongoDB session transaction (`session.withTransaction`) to decrement stock (`$inc: { stock: -quantity }`) and confirm the order. Upon `FAILED`, stock is untouched and the cart remains intact on the mobile device.
- **Cloudinary Integration**: Cloudinary SDK v2 streams validated image buffers directly to the `shopease/products` cloud directory. An active-reference guard prevents deleting images currently associated with live products.

### 6. Data & Cloud Storage Layer
- **Primary Database**: **MongoDB Atlas** managed via **Mongoose ODM**. Schema definitions include validation, indexes, and timestamps.
- **Image CDN**: **Cloudinary** provides global CDN caching, responsive format conversion (WebP/AVIF), and optimized delivery directly to mobile `ProductImage` components.
