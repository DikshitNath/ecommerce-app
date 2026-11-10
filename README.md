# ShopEase – E-Commerce Mobile Application

A full-stack e-commerce application built using **React Native, Expo, TypeScript, Node.js, Express.js, and MongoDB**. The project focuses on providing a smooth shopping experience with product browsing, variant selection, cart management, backend-powered order creation, and payment processing.

> **Project Status:** In Development

## Tech Stack

### Mobile Application
- React Native
- Expo & Expo Router
- TypeScript
- Zustand – State management
- AsyncStorage – Local persistence
- TanStack Query – Server state and API data management
- Axios – HTTP requests

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose – Database modeling
- REST API architecture

## Features Implemented

### 1. Product Catalog
- Fetch products dynamically from the backend.
- Browse products on the Home and Explore screens.
- Search products.
- Filter products by category.
- View individual product details.
- Display product prices, descriptions, and available stock.

### 2. Product Variants
- Support products with multiple variants.
- Select options such as size and color.
- Manage different variant combinations independently in the cart.
- Validate available stock before increasing quantities.

### 3. Shopping Cart
- Add and remove products.
- Increase and decrease product quantities.
- Support variant-based cart items.
- Calculate subtotal and item quantities.
- Persist cart data using Zustand and AsyncStorage.
- Handle empty cart states and stock limitations.

### 4. Checkout
- Display selected products and variants.
- Show delivery address.
- Calculate estimated subtotal, delivery fee, and total amount.
- Pass shipping address information to the payment screen.

### 5. Order Management – Backend
- Create pending orders through REST APIs.
- Fetch all orders.
- Fetch individual order details.
- Calculate order totals on the backend using database product prices.
- Validate product availability, quantities, and selected variants.
- Store order items, shipping address, payment method, and payment status in MongoDB.

### 6. Payment Processing – Backend
- Simulated payment success and failure.
- Update payment and order statuses.
- Deduct product stock only after successful payment.
- Use MongoDB transactions for payment and inventory updates.
- Prevent duplicate successful payment processing.

### 7. Order History
- Display orders fetched from the backend.
- View individual order details.
- Display order status, payment status, product information, and pricing details.
- Include loading, error, retry, and empty states.

## Project Structure

```text
ecommerce-app/
│
├── mobile/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── explore.tsx
│   │   │   │   ├── cart.tsx
│   │   │   │   ├── orders.tsx
│   │   │   │   └── _layout.tsx
│   │   │   │
│   │   │   ├── product-details.tsx
│   │   │   ├── checkout.tsx
│   │   │   ├── payment.tsx
│   │   │   ├── payment-processing.tsx
│   │   │   ├── payment-success.tsx
│   │   │   ├── payment-failure.tsx
│   │   │   ├── order-details.tsx
│   │   │   └── _layout.tsx
│   │   │
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── stores/
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── seed.ts
│   │
│   └── package.json
│
├── docs/
├── screenshots/
├── demo/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- Git
- Expo Go (for testing on a physical Android device)
- MongoDB Atlas account
- VS Code or another code editor

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ecommerce-app
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start the backend development server:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

### 3. Mobile Application Setup

Open another terminal:

```bash
cd mobile
npm install
```

Create a `.env` file inside the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

Replace `YOUR_LOCAL_IP` with your computer's local network IP address when testing on a physical device.

For example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
```

Make sure your mobile device and computer are connected to the same Wi-Fi network.

Start Expo:

```bash
npx expo start --clear
```

Scan the QR code using Expo Go.

## Backend API Endpoints

The backend currently provides the following REST API endpoints:

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Fetch products |
| GET | `/api/products/:id` | Fetch product details |

Product listing supports search, category filtering, and pagination.

### Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Create a pending order |
| GET | `/api/orders` | Fetch orders |
| GET | `/api/orders/:id` | Fetch order details |

### Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/process` | Process simulated payment |

Example payment request:

```json
{
  "orderId": "YOUR_ORDER_ID",
  "outcome": "SUCCESS"
}
```

Supported outcomes:

- `SUCCESS`
- `FAILED`

## Order and Payment Flow

The intended shopping workflow is:

```text
Browse Products
      |
      v
View Product Details
      |
      v
Select Variants
      |
      v
Add to Cart
      |
      v
Checkout
      |
      v
Create Pending Order
      |
      v
Payment Processing
      |
      v
Backend Payment Verification
      |
      +-------------------+
      |                   |
      v                   v
   SUCCESS              FAILED
      |                   |
      v                   v
Order Confirmed      Payment Failed
Stock Deducted       Cart Preserved
```

The backend calculates order totals and validates inventory. Product stock is deducted only after a successful simulated payment.

## Development Commands

### Mobile

```bash
cd mobile

# TypeScript validation
npx tsc --noEmit

# Start Expo
npx expo start --clear
```

### Backend

```bash
cd backend

# TypeScript validation
npx tsc --noEmit

# Start development server
npm run dev
```

## Current Development Status

| Feature | Status |
|---|---|
| Product catalog APIs | Implemented |
| Product browsing and search | Implemented |
| Product variants | Implemented |
| Cart management | Implemented |
| Cart persistence | Implemented |
| Backend order creation | Implemented |
| Order listing and details APIs | Implemented |
| Backend payment processing | Implemented |
| Mobile checkout integration | In progress |
| Mobile payment integration | In progress |
| Payment success/failure verification | In progress |
| Authentication and user ownership | Planned |
| Automated testing | Planned |
| Final APK and documentation | Planned |

## Important Notes

- Payment processing currently uses simulated outcomes. No real payment gateway is connected.
- Cash on Delivery is not yet supported by the backend checkout flow.
- Authentication and customer-specific order ownership still need to be implemented.
- Do not commit `.env` files, MongoDB credentials, or API secrets.
- MongoDB transactions require a MongoDB deployment that supports replica sets or sharding.

## Future Improvements

- User registration and login.
- Secure authentication and session management.
- Customer-specific order history.
- Address management.
- Real payment gateway integration.
- Cash on Delivery support.
- Improved offline and network error handling.
- Automated backend and mobile tests.
- APK generation and deployment documentation.

## Author

**Dikshit Nath**

Full Stack Developer | React Native | Node.js | TypeScript

---

*ShopEase is being developed as a full-stack e-commerce application with a focus on mobile development, REST API integration, state management, database design, and reliable order processing.*