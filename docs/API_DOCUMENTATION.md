# ShopEase REST API Documentation

This document provides the complete, authoritative specification for the ShopEase REST API server. All endpoints, schemas, parameters, and behaviors documented here are derived directly from the backend Express routes, controllers, middleware, and Mongoose models in `backend/src/`.

---

## Table of Contents

1. [API Overview & Base URLs](#1-api-overview--base-urls)
2. [Global Error & Response Conventions](#2-global-error--response-conventions)
3. [Authentication & Authorization Model](#3-authentication--authorization-model)
4. [Health Check Endpoint](#4-health-check-endpoint)
5. [Authentication Endpoints](#5-authentication-endpoints)
6. [Product & Catalog Endpoints](#6-product--catalog-endpoints)
7. [Cart Architecture & Lifecycle](#7-cart-architecture--lifecycle)
8. [Checkout & Customer Order Endpoints](#8-checkout--customer-order-endpoints)
9. [Payment Simulation Endpoints](#9-payment-simulation-endpoints)
10. [Media Upload & Cloudinary Endpoints](#10-media-upload--cloudinary-endpoints)
11. [Administrator Product Management Endpoints](#11-administrator-product-management-endpoints)
12. [Administrator Order Management Endpoints](#12-administrator-order-management-endpoints)
13. [HTTP Status Codes Reference](#13-http-status-codes-reference)

---

## 1. API Overview & Base URLs

ShopEase features a decoupled client-server architecture. The mobile client (built with Expo / React Native) communicates with the backend exclusively via standard HTTPS/HTTP JSON REST APIs (with multipart support for binary image uploads).

### Base URLs

| Environment | Base URL | Health Check URL | Description |
|---|---|---|---|
| **Production (Render)** | `https://shopease-backend-s8xj.onrender.com/api` | `https://shopease-backend-s8xj.onrender.com/api/health` | Live cloud deployment backed by MongoDB Atlas and Cloudinary CDN |
| **Local Development** | `http://localhost:5000/api` | `http://localhost:5000/api/health` | Running locally on port `5000` |
| **Physical Device (Local Wi-Fi)** | `http://<YOUR_COMPUTER_LAN_IP>:5000/api` | `http://<YOUR_COMPUTER_LAN_IP>:5000/api/health` | For physical Android devices testing over same Wi-Fi |
| **Android Studio Emulator** | `http://10.0.2.2:5000/api` | `http://10.0.2.2:5000/api/health` | Android standard loopback to host development machine |

---

## 2. Global Error & Response Conventions

### Success Response Format
Standard responses return a JSON object with `success: true`:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Paginated Response Format
Endpoints returning paginated lists return metadata under a `pagination` object:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Error Response Format
Errors return consistent JSON structures with appropriate HTTP status codes:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### Validation Error Format (HTTP 400)
When schema validation fails (via `zod` or controller input checks), an `errors` array provides field-level feedback:

```json
{
  "success": false,
  "message": "Invalid registration details",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 3. Authentication & Authorization Model

ShopEase uses stateless **JSON Web Tokens (JWT)** for session authentication.

### Token Authentication Header
Protected endpoints require the JWT token passed in the standard `Authorization` HTTP header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### User Roles
The database defines two mutually exclusive roles on the `User` schema (`backend/src/models/user.model.ts`):

1. **`customer` (Default)**: Assigned to all self-registered users. Permitted to browse products, create pending orders, process payments, and retrieve their own order history.
2. **`admin`**: Granted through direct administrative promotion. Permitted to create, update, and soft-delete products, upload and remove Cloudinary media, access all customer orders, execute debounced order searches, and update order statuses.

### Security Middleware
- **`authenticate` (`backend/src/middleware/auth.middleware.ts`)**: Verifies the signature and expiration of the Bearer JWT token against `JWT_SECRET`. Rejects missing, forged, or expired tokens with `401 Unauthorized`. Populates `req.user.userId`.
- **`requireAdmin` (`backend/src/middleware/admin.middleware.ts`)**: Runs after `authenticate`. Queries the authenticated user in MongoDB and verifies `user.role === "admin"`. Standard customers receive `403 Forbidden`.

---

## 4. Health Check Endpoint

### Check Backend Status

Verifies server availability and MongoDB connectivity.

- **Method**: `GET`
- **Path**: `/api/health`
- **Access**: Public (No authentication required)
- **Response**: `200 OK`

```json
{
  "success": true,
  "message": "E-Commerce API is running",
  "timestamp": "2026-11-15T18:00:00.000Z"
}
```

---

## 5. Authentication Endpoints

Base path: `/api/auth` (mounted in `backend/src/routes/auth.routes.ts`)

### 5.1 Register Customer Account

Registers a new user account. Public registration automatically assigns `role: "customer"`.

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Validation**:
  - `name`: String, minimum 2 characters.
  - `email`: String, valid email format (stored lowercase & trimmed).
  - `password`: String, minimum 8 characters (encrypted via `bcryptjs` with 12 salt rounds).

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67379f8b4a2e1d0012ab34cd",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "customer"
    }
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Validation error (invalid email format, short password, etc.).
- **`409 Conflict`**: Email already registered (`"Email is already registered"`).

---

### 5.2 Login User

Authenticates credentials and returns a signed JWT session token.

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67379f8b4a2e1d0012ab34cd",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "customer"
    }
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Missing email or password.
- **`401 Unauthorized`**: Invalid email or incorrect password (`"Invalid email or password"`).

---

### 5.3 Get Current User Profile

Retrieves the authenticated user's profile and active role from database state.

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Access**: Authenticated (`customer` or `admin`)
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "67379f8b4a2e1d0012ab34cd",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "customer",
    "createdAt": "2026-11-15T18:30:00.000Z"
  }
}
```

#### Error Responses
- **`401 Unauthorized`**: Missing or invalid Bearer token.
- **`404 Not Found`**: User account was deleted from the database.

---

## 6. Product & Catalog Endpoints

Base path: `/api/products` (mounted in `backend/src/routes/product.routes.ts`)

### 6.1 List Active Products

Retrieves paginated active products. Excludes soft-deleted products (`isActive: false`).

- **Method**: `GET`
- **Path**: `/api/products`
- **Access**: Public

#### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | String | *None* | Case-insensitive substring match against product `name` |
| `category` | String | *None* | Exact category filter (e.g. `Fashion`, `Electronics`, `Shoes`, `Watches`) |
| `page` | Integer | `1` | Page number (minimum 1) |
| `limit` | Integer | `10` | Number of items per page (minimum 1, maximum 50) |

#### Example Request
```http
GET /api/products?category=Shoes&search=running&page=1&limit=10
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "6737a1b04a2e1d0012ab34ce",
      "name": "CloudStrider Pro Running Shoes",
      "description": "Engineered breathable mesh with responsive cushioning for marathon training.",
      "price": 4999,
      "category": "Shoes",
      "images": [
        "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-shoe-1.jpg"
      ],
      "stock": 25,
      "sku": "SHOE-RUN-001",
      "variants": [
        {
          "name": "Size",
          "options": ["8", "9", "10", "11"]
        },
        {
          "name": "Color",
          "options": ["Black", "White", "Navy"]
        }
      ],
      "isActive": true,
      "createdAt": "2026-11-15T10:00:00.000Z",
      "updatedAt": "2026-11-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6.2 Get Single Product by ID

Retrieves detailed information for an active product.

- **Method**: `GET`
- **Path**: `/api/products/:id`
- **Access**: Public
- **Parameters**: `id` — Valid 24-character MongoDB `ObjectId`.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "_id": "6737a1b04a2e1d0012ab34ce",
    "name": "CloudStrider Pro Running Shoes",
    "description": "Engineered breathable mesh with responsive cushioning for marathon training.",
    "price": 4999,
    "category": "Shoes",
    "images": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-shoe-1.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-shoe-2.jpg"
    ],
    "stock": 25,
    "sku": "SHOE-RUN-001",
    "variants": [
      {
        "name": "Size",
        "options": ["8", "9", "10", "11"]
      },
      {
        "name": "Color",
        "options": ["Black", "White", "Navy"]
      }
    ],
    "isActive": true,
    "createdAt": "2026-11-15T10:00:00.000Z",
    "updatedAt": "2026-11-15T10:00:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Malformed or non-ObjectId parameter (`"Invalid product ID"`).
- **`404 Not Found`**: Product ID does not exist or has been soft-deleted (`"Product not found"`).

---

## 7. Cart Architecture & Lifecycle

### Architectural Design
In accordance with mobile-first offline-capable engineering patterns:
- **No Dedicated CRUD Cart Endpoints Exist on the Backend Server.**
- Cart state (items, selected variant combinations, quantities) is managed on the mobile client using Zustand (`useCartStore`) and persisted locally via `@react-native-async-storage/async-storage`.
- This ensures customers can browse, add, edit, and retain cart items offline or during intermittent network conditions without unnecessary server roundtrips.
- **Server Verification**: The complete cart payload is transmitted to the backend during Checkout via `POST /api/orders`. The backend validates product availability, confirms variant options exist, checks aggregate inventory stock limits, and computes totals using database prices.

---

## 8. Checkout & Customer Order Endpoints

Base path: `/api/orders` (mounted in `backend/src/routes/order.routes.ts`)

All order endpoints require user authentication (`authenticate` middleware).

### 8.1 Create Pending Order

Validates cart items against real-time database stock, calculates server-verified totals, and creates an order with `orderStatus: "PENDING"` and `paymentStatus: "PENDING"`.

- **Method**: `POST`
- **Path**: `/api/orders`
- **Access**: Authenticated (`customer` or `admin`)
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Business Rules & Validation
1. **Cart Must Not Be Empty**: Rejects empty item arrays (`400 Bad Request`).
2. **Product Verification**: All products must exist and have `isActive: true`.
3. **Aggregate Stock Validation**: Validates that the sum of quantities across different variant lines of the same product does not exceed `product.stock`.
4. **Variant Selection Guard**: Validates that all configured product variants (e.g. Size, Color) are explicitly selected and match allowed options.
5. **Server Pricing**: Item prices are retrieved directly from the MongoDB `Product` record; client-submitted prices are ignored.
6. **Delivery Fee**: Fixed delivery fee of `₹40` is applied automatically.

#### Request Body
```json
{
  "items": [
    {
      "productId": "6737a1b04a2e1d0012ab34ce",
      "quantity": 2,
      "selectedVariants": {
        "Size": "10",
        "Color": "Black"
      }
    }
  ],
  "shippingAddress": {
    "fullName": "Jane Doe",
    "phone": "9876543210",
    "addressLine": "Flat 402, Green Heights, MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001"
  },
  "paymentMethod": "CARD"
}
```

*Allowed `paymentMethod` values*: `"UPI"`, `"CARD"`, `"COD"`

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Order created successfully. Payment is pending.",
  "data": {
    "_id": "6737a4c84a2e1d0012ab34cf",
    "userId": "67379f8b4a2e1d0012ab34cd",
    "orderNumber": "ORD-1731698888000-412",
    "items": [
      {
        "productId": "6737a1b04a2e1d0012ab34ce",
        "name": "CloudStrider Pro Running Shoes",
        "sku": "SHOE-RUN-001",
        "price": 4999,
        "quantity": 2,
        "selectedVariants": {
          "Size": "10",
          "Color": "Black"
        }
      }
    ],
    "shippingAddress": {
      "fullName": "Jane Doe",
      "phone": "9876543210",
      "addressLine": "Flat 402, Green Heights, MG Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560001"
    },
    "subtotal": 9998,
    "deliveryFee": 40,
    "totalAmount": 10038,
    "paymentMethod": "CARD",
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING",
    "createdAt": "2026-11-15T18:40:00.000Z",
    "updatedAt": "2026-11-15T18:40:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Empty cart, invalid variant selection, or missing address fields.
- **`400 Bad Request`**: Insufficient inventory (`"Insufficient stock for CloudStrider Pro Running Shoes."`).
- **`404 Not Found`**: One or more product IDs do not exist or are inactive.

---

### 8.2 Get Customer Order History

Retrieves the authenticated customer's own orders, sorted newest first (`createdAt: -1`). Enforces strict customer isolation.

- **Method**: `GET`
- **Path**: `/api/orders`
- **Access**: Authenticated Customer
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Query Parameters
- `page` (optional, default `1`): Page number.
- `limit` (optional, default `10`, max `50`): Page size limit.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Orders retrieved successfully.",
  "data": [
    {
      "_id": "6737a4c84a2e1d0012ab34cf",
      "orderNumber": "ORD-1731698888000-412",
      "items": [ ... ],
      "subtotal": 9998,
      "deliveryFee": 40,
      "totalAmount": 10038,
      "paymentMethod": "CARD",
      "paymentStatus": "SUCCESS",
      "orderStatus": "CONFIRMED",
      "createdAt": "2026-11-15T18:40:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalOrders": 1,
    "limit": 10
  }
}
```

---

### 8.3 Get Customer Order by ID

Retrieves an individual order receipt. Customers can only retrieve orders they created; requesting another user's order ID returns `404 Not Found`.

- **Method**: `GET`
- **Path**: `/api/orders/:id`
- **Access**: Authenticated Customer
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Parameters**: `id` — Order ObjectId.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Order retrieved successfully.",
  "data": {
    "_id": "6737a4c84a2e1d0012ab34cf",
    "userId": "67379f8b4a2e1d0012ab34cd",
    "orderNumber": "ORD-1731698888000-412",
    "items": [ ... ],
    "shippingAddress": { ... },
    "subtotal": 9998,
    "deliveryFee": 40,
    "totalAmount": 10038,
    "paymentMethod": "CARD",
    "paymentStatus": "SUCCESS",
    "orderStatus": "CONFIRMED",
    "createdAt": "2026-11-15T18:40:00.000Z",
    "updatedAt": "2026-11-15T18:42:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Malformed order ID.
- **`404 Not Found`**: Order does not exist or belongs to another customer.

---

## 9. Payment Simulation Endpoints

Base path: `/api/payments` (mounted in `backend/src/routes/payment.routes.ts`)

### Simulation Notice
> [!NOTE]
> **Assessment Simulation Design**: ShopEase uses a simulated payment processing workflow (`SUCCESS` vs. `FAILED`) to fulfill assessment requirements without charging real banking credentials or requiring commercial gateway keys (e.g. Razorpay/Stripe).

### 9.1 Process Simulated Payment Outcome

Processes the payment outcome for a pending order.

- **Method**: `POST`
- **Path**: `/api/payments/process`
- **Access**: Authenticated Customer (must own the order)
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Request Body
```json
{
  "orderId": "6737a4c84a2e1d0012ab34cf",
  "outcome": "SUCCESS"
}
```

*Allowed `outcome` values*: `"SUCCESS"`, `"FAILED"`

#### Transactional Mechanics
- **When `outcome === "SUCCESS"`**:
  1. Opens an atomic MongoDB session transaction (`session.withTransaction`).
  2. Verifies order ownership and confirms order is currently in `PENDING` payment state.
  3. Atomically checks and decrements product inventory:
     `Product.findOneAndUpdate({ _id: productId, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`
  4. If stock is no longer available, the transaction aborts and returns `400 Bad Request`.
  5. Updates order to `paymentStatus: "SUCCESS"` and `orderStatus: "CONFIRMED"`.
  6. **Idempotency**: Repeated calls on an already-confirmed order return the confirmed order without double-deducting stock.
- **When `outcome === "FAILED"`**:
  1. Updates order to `paymentStatus: "FAILED"` (order remains `orderStatus: "PENDING"`).
  2. Does **not** deduct inventory stock.
  3. Client application strictly preserves cart contents so the customer can retry payment without re-adding items or creating duplicate orders.

#### Success Response for `SUCCESS` (`200 OK`)
```json
{
  "success": true,
  "message": "Payment successful. Order confirmed.",
  "data": {
    "_id": "6737a4c84a2e1d0012ab34cf",
    "orderNumber": "ORD-1731698888000-412",
    "paymentStatus": "SUCCESS",
    "orderStatus": "CONFIRMED",
    "updatedAt": "2026-11-15T18:42:00.000Z"
  }
}
```

#### Success Response for `FAILED` (`200 OK`)
```json
{
  "success": true,
  "message": "Payment failed. Order remains pending.",
  "data": {
    "_id": "6737a4c84a2e1d0012ab34cf",
    "orderNumber": "ORD-1731698888000-412",
    "paymentStatus": "FAILED",
    "orderStatus": "PENDING",
    "updatedAt": "2026-11-15T18:42:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Missing order ID, invalid outcome string, or insufficient inventory stock at payment time.
- **`403 Forbidden`**: Requesting payment for an order belonging to another customer (`"You are not authorized to pay for this order."`).
- **`404 Not Found`**: Order ID not found.

---

## 10. Media Upload & Cloudinary Endpoints

Base path: `/api/upload` (mounted in `backend/src/routes/upload.routes.ts`)

Image storage uses the official **Cloudinary Node.js SDK**. Images are streamed directly to Cloudinary folder `shopease/products` from Multer in-memory buffers.

### 10.1 Upload Product Images (Admin Only)

Uploads up to 10 product images per batch. Supports both `multipart/form-data` and JSON base64 payloads.

- **Method**: `POST`
- **Path**: `/api/upload/images` (alias: `/api/upload`)
- **Access**: Authenticated Administrator (`requireAdmin`)
- **Headers**:
  - `Authorization: Bearer <ADMIN_TOKEN>`
  - `Content-Type: multipart/form-data` (or `application/json`)

#### File & Binary Validation
- **Size Limit**: 5 MB per image (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
- **Batch Limit**: Maximum 10 images per request.
- **MIME & Magic Bytes Inspection**: Binary signature inspection validates real image buffers (PNG `89 50 4E 47`, JPEG `FF D8 FF`, WEBP `52 49 46 46`, GIF `47 49 46 38`, HEIC `ftypheic/ftypmif1`).
- **Transcoding Reconciliation**: Reconciles Android / Expo cases where declared MIME is HEIC/PNG but the native picker transcoded/compressed to JPEG.

#### Multipart Form Data
- Field Name: `images` (Array of files)

#### Alternative JSON Base64 Body
```json
{
  "images": [
    {
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "filename": "shoe-side.jpg",
      "mimeType": "image/jpeg"
    }
  ]
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "count": 1,
  "files": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-1731697200000-a1b2c3d4.jpg",
      "filename": "product-1731697200000-a1b2c3d4.jpg",
      "size": 245890,
      "mimetype": "image/jpeg",
      "publicId": "shopease/products/product-1731697200000-a1b2c3d4"
    }
  ]
}
```

#### Error Responses
- **`400 Bad Request`**: File exceeds 5MB limit (`"File too large. Maximum size is 5MB per image."`).
- **`400 Bad Request`**: Batch exceeds 10 files limit.
- **`400 Bad Request`**: Corrupt file or non-image format.
- **`403 Forbidden`**: Customer attempted upload.

---

### 10.2 Delete Image from Cloudinary (Admin Only)

Deletes an unreferenced product image from Cloudinary by its public ID or full URL.

- **Method**: `DELETE`
- **Path**: `/api/upload/images` or `/api/upload/{*publicId}`
- **Access**: Authenticated Administrator (`requireAdmin`)
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`

#### Safety Reference Guard
Before deleting, the server queries MongoDB:
`Product.findOne({ images: { $regex: escapedId }, isActive: true })`
If an active product is currently using the image, the server **blocks deletion** and returns `409 Conflict`.

#### Request Body (for `DELETE /api/upload/images`)
```json
{
  "publicId": "shopease/products/product-1731697200000-a1b2c3d4"
}
```
*(Or passing `{ "url": "https://res.cloudinary.com/.../shopease/products/..." }`)*

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Image deleted successfully from Cloudinary.",
  "publicId": "shopease/products/product-1731697200000-a1b2c3d4",
  "result": "ok"
}
```

#### Error Responses
- **`400 Bad Request`**: Missing `publicId` or publicId does not belong to `shopease/products/`.
- **`409 Conflict`**: Image is still used by an active product (`"Cannot delete image: it is still referenced by active product..."`).

---

### 10.3 Legacy Static Image Serving (Backward Compatibility)

- **Method**: `GET`
- **Path**: `/uploads/*`
- **Access**: Public
- **Description**: Serves static files stored in local `/uploads/products/` for pre-existing synthetic seed data. New uploads stream directly to Cloudinary CDN.

---

## 11. Administrator Product Management Endpoints

Base path: `/api/products` (mounted in `backend/src/routes/product.routes.ts`)

All endpoints in this section require `authenticate` and `requireAdmin` middleware.

### 11.1 Create Product

Creates a new product catalog document.

- **Method**: `POST`
- **Path**: `/api/products`
- **Access**: Authenticated Administrator

#### Request Body
```json
{
  "name": "Noise-Cancelling Over-Ear Headphones",
  "description": "High-fidelity active noise cancellation with 40-hour battery life and Bluetooth 5.3.",
  "price": 8999,
  "category": "Electronics",
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-headphones.jpg"
  ],
  "stock": 40,
  "sku": "ELEC-HEAD-001",
  "variants": [
    {
      "name": "Color",
      "options": ["Matte Black", "Silver", "Midnight Blue"]
    }
  ]
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Product created successfully.",
  "data": {
    "_id": "6737a8f04a2e1d0012ab34d0",
    "name": "Noise-Cancelling Over-Ear Headphones",
    "description": "High-fidelity active noise cancellation with 40-hour battery life and Bluetooth 5.3.",
    "price": 8999,
    "category": "Electronics",
    "images": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-headphones.jpg"
    ],
    "stock": 40,
    "sku": "ELEC-HEAD-001",
    "variants": [
      {
        "name": "Color",
        "options": ["Matte Black", "Silver", "Midnight Blue"]
      }
    ],
    "isActive": true,
    "createdAt": "2026-11-15T19:00:00.000Z",
    "updatedAt": "2026-11-15T19:00:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Validation failure (empty name, negative price, negative stock).
- **`409 Conflict`**: SKU collision (`"A product with this SKU already exists."`).

---

### 11.2 Update Product

Updates an existing active product. Supports partial updates.

- **Method**: `PUT`
- **Path**: `/api/products/:id`
- **Access**: Authenticated Administrator
- **Parameters**: `id` — Product ObjectId.

#### Request Body (Partial Fields Allowed)
```json
{
  "price": 7999,
  "stock": 35,
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1731697200/shopease/products/product-headphones-updated.jpg"
  ]
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Product updated successfully.",
  "data": {
    "_id": "6737a8f04a2e1d0012ab34d0",
    "name": "Noise-Cancelling Over-Ear Headphones",
    "price": 7999,
    "stock": 35,
    "updatedAt": "2026-11-15T19:05:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: No valid fields provided or validation failure.
- **`404 Not Found`**: Product not found or inactive.
- **`409 Conflict`**: Updated SKU collides with another product.

---

### 11.3 Soft-Delete Product

Soft-deletes a product by marking `isActive: false`. Preserves data integrity for historic order receipts while excluding the product from public catalog listings and future order creations.

- **Method**: `DELETE`
- **Path**: `/api/products/:id`
- **Access**: Authenticated Administrator
- **Parameters**: `id` — Product ObjectId.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Product removed successfully.",
  "data": {
    "_id": "6737a8f04a2e1d0012ab34d0",
    "name": "Noise-Cancelling Over-Ear Headphones",
    "isActive": false,
    "updatedAt": "2026-11-15T19:10:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Invalid product ID format.
- **`404 Not Found`**: Product not found or already deactivated (`"Product not found or already removed."`).

---

## 12. Administrator Order Management Endpoints

Base path: `/api/orders` (mounted in `backend/src/routes/order.routes.ts`)

All endpoints in this section require `authenticate` and `requireAdmin` middleware.

### 12.1 List All Customer Orders (Admin Feed)

Retrieves all customer orders across the platform. Populates customer information (`userId: { name, email }`).

- **Method**: `GET`
- **Path**: `/api/orders/admin`
- **Access**: Authenticated Administrator

#### Query Parameters & Filtering

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | String | *All* | Status filter pill: `"ALL"`, `"PENDING"`, `"CONFIRMED"`, `"FAILED"`, `"CANCELLED"` |
| `search` | String | *None* | Debounced search query matching Order Number (`orderNumber`), Shipping Name (`shippingAddress.fullName`), Customer Name (`user.name`), or Customer Email (`user.email`) |
| `page` | Integer | `1` | Pagination page number |
| `limit` | Integer | `10` | Page size limit (maximum 50) |

#### Example Request
```http
GET /api/orders/admin?status=CONFIRMED&search=Jane&page=1&limit=10
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Admin orders retrieved successfully.",
  "data": [
    {
      "_id": "6737a4c84a2e1d0012ab34cf",
      "userId": {
        "_id": "67379f8b4a2e1d0012ab34cd",
        "name": "Jane Doe",
        "email": "jane.doe@example.com"
      },
      "orderNumber": "ORD-1731698888000-412",
      "items": [
        {
          "productId": "6737a1b04a2e1d0012ab34ce",
          "name": "CloudStrider Pro Running Shoes",
          "sku": "SHOE-RUN-001",
          "price": 4999,
          "quantity": 2,
          "selectedVariants": {
            "Size": "10",
            "Color": "Black"
          }
        }
      ],
      "shippingAddress": {
        "fullName": "Jane Doe",
        "phone": "9876543210",
        "addressLine": "Flat 402, Green Heights, MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560001"
      },
      "subtotal": 9998,
      "deliveryFee": 40,
      "totalAmount": 10038,
      "paymentMethod": "CARD",
      "paymentStatus": "SUCCESS",
      "orderStatus": "CONFIRMED",
      "createdAt": "2026-11-15T18:40:00.000Z",
      "updatedAt": "2026-11-15T18:42:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalOrders": 1,
    "limit": 10
  }
}
```

---

### 12.2 Get Detailed Customer Order (Admin)

Retrieves the complete breakdown of any order by ID, including populated customer profile details.

- **Method**: `GET`
- **Path**: `/api/orders/admin/:id`
- **Access**: Authenticated Administrator
- **Parameters**: `id` — Order ObjectId.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Order details retrieved successfully.",
  "data": {
    "_id": "6737a4c84a2e1d0012ab34cf",
    "userId": {
      "_id": "67379f8b4a2e1d0012ab34cd",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    },
    "orderNumber": "ORD-1731698888000-412",
    "items": [ ... ],
    "shippingAddress": { ... },
    "subtotal": 9998,
    "deliveryFee": 40,
    "totalAmount": 10038,
    "paymentMethod": "CARD",
    "paymentStatus": "SUCCESS",
    "orderStatus": "CONFIRMED",
    "createdAt": "2026-11-15T18:40:00.000Z",
    "updatedAt": "2026-11-15T18:42:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`**: Invalid order ID format.
- **`401 Unauthorized`**: Authentication missing.
- **`403 Forbidden`**: Customer role attempted access.
- **`404 Not Found`**: Order ID not found in database.

---

## 13. HTTP Status Codes Reference

The ShopEase REST API follows standard RESTful HTTP status code semantics:

| HTTP Status | Name | Meaning & When Returned |
|:---:|---|---|
| **200** | `OK` | Standard successful response for `GET`, `PUT`, and `DELETE` operations |
| **201** | `Created` | Successful creation response (`POST /api/auth/register`, `POST /api/orders`, `POST /api/products`, `POST /api/upload/images`) |
| **400** | `Bad Request` | Malformed JSON, missing required fields, schema validation failure, or file size/type rejection |
| **401** | `Unauthorized` | Missing, forged, or expired JWT Bearer token in the `Authorization` header |
| **403** | `Forbidden` | Authenticated user lacks required permissions (e.g., customer attempting to access admin routes or another customer's order) |
| **404** | `Not Found` | Requested resource ID does not exist in the database or has been soft-deleted |
| **409** | `Conflict` | Unique constraint collision (duplicate email registration, SKU collision) or attempted deletion of a Cloudinary image referenced by an active product |
| **500** | `Internal Server Error` | Unexpected server exception or missing environment variables (`JWT_SECRET`, Cloudinary credentials) |
