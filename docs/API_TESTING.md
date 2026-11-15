# ShopEase API Testing Guide

This guide provides repeatable `curl` examples to test and verify all core ShopEase REST API endpoints.

> [!WARNING]
> **Production Safety Notice**:
> Write operations (`POST /auth/register`, `POST /orders`, `POST /payments/process`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`) create or modify records in the target database.
> - **Recommended**: Target the **Local Development Server** (`http://localhost:5000/api`) when testing write and mutation flows.
> - **Production Testing**: If evaluating against the live Render production backend (`https://shopease-backend-s8xj.onrender.com/api`), prefer read-only endpoints (`GET /health`, `GET /products`, `GET /products/:id`), or use dedicated disposable test accounts.

---

## 1. Environments & Base URLs

Set your target environment variable before running requests. By default, target local development to preserve production state:

### Linux / macOS / Git Bash
```bash
# Local Development Server (Recommended for safe write & mutation testing)
export BASE_URL="http://localhost:5000/api"

# Production Render Backend (Use when evaluating live deployment)
# export BASE_URL="https://shopease-backend-s8xj.onrender.com/api"
```

### Windows PowerShell
```powershell
# Local Development Server (Recommended for safe write & mutation testing)
$env:BASE_URL = "http://localhost:5000/api"

# Production Render Backend (Use when evaluating live deployment)
# $env:BASE_URL = "https://shopease-backend-s8xj.onrender.com/api"
```

---

## 2. Authentication & JWT Tokens

ShopEase uses stateless Bearer JWT tokens in the `Authorization` HTTP header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### How to Obtain a Token
1. **Self-Registration (Customer Token)**: Run the registration command below with your email and password. The API responds with `data.token`.
2. **Login (Customer or Admin Token)**: Run the login command with valid credentials. The API responds with `data.token`.
3. Store the returned token into an environment variable:
   ```bash
   export CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

> [!IMPORTANT]
> Never commit actual JWT tokens, production passwords, or database secrets to version control. Replace placeholder tokens (`<CUSTOMER_JWT_TOKEN>`, `<ADMIN_JWT_TOKEN>`) with real tokens returned by your API instance.

---

## 3. Public Endpoints (No Authentication Required)

### 3.1 Health Check
Verifies server health and database connectivity.

```bash
curl -X GET "$BASE_URL/health" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "E-Commerce API is running",
  "timestamp": "2026-11-15T18:00:00.000Z"
}
```

---

### 3.2 Register Customer Account
Creates a new customer account and immediately returns a valid JWT token.

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<CUSTOMER_JWT_TOKEN>",
    "user": {
      "id": "6737c0004a2e1d0012ac0001",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "customer"
    }
  }
}
```

---

### 3.3 User Login
Authenticates credentials and returns a JWT session token.

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<CUSTOMER_JWT_TOKEN>",
    "user": {
      "id": "6737c0004a2e1d0012ac0001",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "customer"
    }
  }
}
```

---

### 3.4 Product Catalog Listing (with Filters & Pagination)
Lists active products. Supports `category`, `search`, `page`, and `limit` query parameters.

#### List all products (Page 1, 10 items):
```bash
curl -X GET "$BASE_URL/products?page=1&limit=10" \
  -H "Accept: application/json"
```

#### Filter by category and search keyword:
```bash
curl -X GET "$BASE_URL/products?category=Footwear&search=running&page=1&limit=10" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "6737b1004a2e1d0012ab0001",
      "name": "AeroStride Pro Running Shoes",
      "description": "Lightweight performance running shoes with breathable mesh and responsive cushioning.",
      "price": 4499,
      "category": "Footwear",
      "images": [
        "https://placehold.co/800x800/222222/ffffff/png?text=AeroStride+Pro+Running+Shoes+1"
      ],
      "stock": 30,
      "sku": "FOOT-AERO-001",
      "variants": [
        {
          "name": "Size",
          "options": ["8", "9", "10", "11"]
        },
        {
          "name": "Color",
          "options": ["Stealth Black", "Electric Blue"]
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

### 3.5 Single Product Details
Retrieves details of an individual active product by its 24-character hexadecimal MongoDB `ObjectId`.

```bash
curl -X GET "$BASE_URL/products/6737b1004a2e1d0012ab0001" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "_id": "6737b1004a2e1d0012ab0001",
    "name": "AeroStride Pro Running Shoes",
    "price": 4499,
    "category": "Footwear",
    "stock": 30,
    "sku": "FOOT-AERO-001",
    "isActive": true
  }
}
```

---

## 4. Customer-Authenticated Endpoints

All endpoints in this section require the header:
`-H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"`

### 4.1 Verify Profile (`GET /auth/me`)

```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "6737c0004a2e1d0012ac0001",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "customer",
    "createdAt": "2026-11-15T09:00:00.000Z"
  }
}
```

---

### 4.2 Create Pending Order (`POST /orders`)
Submits a cart for server-side verification and creates an order with `orderStatus: "PENDING"`.

```bash
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "6737b1004a2e1d0012ab0001",
        "quantity": 1,
        "selectedVariants": {
          "Size": "10",
          "Color": "Stealth Black"
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
  }'
```

**Expected Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Order created successfully. Payment is pending.",
  "data": {
    "_id": "6737d0004a2e1d0012ad0001",
    "orderNumber": "ORD-1731698888000-101",
    "subtotal": 4499,
    "deliveryFee": 40,
    "totalAmount": 4539,
    "paymentMethod": "CARD",
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING"
  }
}
```

---

### 4.3 Payment Simulation (`POST /payments/process`)
Simulates the outcome of payment processing on a pending order.

#### Case A: Successful Payment (`outcome: "SUCCESS"`)
Atomically decrements product stock and confirms the order:

```bash
curl -X POST "$BASE_URL/payments/process" \
  -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "6737d0004a2e1d0012ad0001",
    "outcome": "SUCCESS"
  }'
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Payment successful. Order confirmed.",
  "data": {
    "_id": "6737d0004a2e1d0012ad0001",
    "orderNumber": "ORD-1731698888000-101",
    "paymentStatus": "SUCCESS",
    "orderStatus": "CONFIRMED"
  }
}
```

#### Case B: Failed Payment (`outcome: "FAILED"`)
Leaves inventory intact, marks payment failed, and retains order pending so the customer can retry without losing their cart:

```bash
curl -X POST "$BASE_URL/payments/process" \
  -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "6737d0004a2e1d0012ad0001",
    "outcome": "FAILED"
  }'
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Payment failed. Order remains pending.",
  "data": {
    "_id": "6737d0004a2e1d0012ad0001",
    "orderNumber": "ORD-1731698888000-101",
    "paymentStatus": "FAILED",
    "orderStatus": "PENDING"
  }
}
```

---

### 4.4 Customer Order History (`GET /orders`)
Retrieves the authenticated customer's own order receipts, sorted newest first.

```bash
curl -X GET "$BASE_URL/orders?page=1&limit=10" \
  -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Orders retrieved successfully.",
  "data": [
    {
      "_id": "6737d0004a2e1d0012ad0001",
      "orderNumber": "ORD-1731698888000-101",
      "subtotal": 4499,
      "deliveryFee": 40,
      "totalAmount": 4539,
      "paymentMethod": "CARD",
      "paymentStatus": "SUCCESS",
      "orderStatus": "CONFIRMED",
      "createdAt": "2026-11-15T12:00:00.000Z"
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

## 5. Administrator-Authenticated Endpoints

All endpoints in this section require:
- A valid JWT token belonging to an account with `role: "admin"`
- Header: `-H "Authorization: Bearer <ADMIN_JWT_TOKEN>"`

Non-admin tokens receive `403 Forbidden`.

### 5.1 Admin Order Feed (`GET /orders/admin`)
Retrieves platform-wide customer orders with customer email/name populated. Supports status filter pills and debounced search.

#### List all platform orders:
```bash
curl -X GET "$BASE_URL/orders/admin?page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Accept: application/json"
```

#### Filter orders by status (`CONFIRMED`) and customer search query:
```bash
curl -X GET "$BASE_URL/orders/admin?status=CONFIRMED&search=Jane&page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Admin orders retrieved successfully.",
  "data": [
    {
      "_id": "6737d0004a2e1d0012ad0001",
      "userId": {
        "_id": "6737c0004a2e1d0012ac0001",
        "name": "Jane Doe",
        "email": "jane.doe@example.com"
      },
      "orderNumber": "ORD-1731698888000-101",
      "subtotal": 4499,
      "deliveryFee": 40,
      "totalAmount": 4539,
      "paymentMethod": "CARD",
      "paymentStatus": "SUCCESS",
      "orderStatus": "CONFIRMED",
      "createdAt": "2026-11-15T12:00:00.000Z"
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

### 5.2 Admin Order Detail by ID (`GET /orders/admin/:id`)
Retrieves the comprehensive order receipt for any customer.

```bash
curl -X GET "$BASE_URL/orders/admin/6737d0004a2e1d0012ad0001" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Accept: application/json"
```

**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Order details retrieved successfully.",
  "data": {
    "_id": "6737d0004a2e1d0012ad0001",
    "userId": {
      "_id": "6737c0004a2e1d0012ac0001",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    },
    "orderNumber": "ORD-1731698888000-101",
    "paymentStatus": "SUCCESS",
    "orderStatus": "CONFIRMED"
  }
}
```

---

### 5.3 Admin Create Product (`POST /products`)

```bash
curl -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AeroStride Pro Running Shoes",
    "description": "Lightweight performance running shoes with breathable mesh.",
    "price": 4499,
    "category": "Footwear",
    "images": [
      "https://placehold.co/800x800/222222/ffffff/png?text=AeroStride+Pro"
    ],
    "stock": 30,
    "sku": "FOOT-AERO-001",
    "variants": [
      {
        "name": "Size",
        "options": ["8", "9", "10", "11"]
      }
    ]
  }'
```

**Expected Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Product created successfully.",
  "data": {
    "_id": "6737b1004a2e1d0012ab0001",
    "name": "AeroStride Pro Running Shoes",
    "sku": "FOOT-AERO-001",
    "isActive": true
  }
}
```

---

## 6. Testing Script Quick Reference

To test the entire flow sequentially via command line:

```bash
# 1. Health Check
curl -s "$BASE_URL/health"

# 2. Register & capture customer token
REG_RESP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test_'$(date +%s)'@example.com","password":"Password123!"}')
echo "$REG_RESP"

CUSTOMER_TOKEN=$(echo "$REG_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. Fetch products
curl -s "$BASE_URL/products?limit=2"

# 4. Check profile with customer token
curl -s -H "Authorization: Bearer $CUSTOMER_TOKEN" "$BASE_URL/auth/me"
```
