# ShopEase Database Schema & Entity Relationship Specification

This document specifies the MongoDB database schema for ShopEase, implemented using Mongoose ODM in `backend/src/models/`. It details the collections, embedded subdocuments, foreign key references, and indexes, highlighting the boundary between client-managed state and server database persistence.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        ObjectId _id PK "Auto-generated ObjectId"
        string name "Full Name (minlength: 2)"
        string email UK "Indexed, Lowercase, Trimmed"
        string password "bcrypt hash (12 salt rounds), select: false"
        string role "enum: 'customer' | 'admin' (default: 'customer')"
        date createdAt "Timestamp"
        date updatedAt "Timestamp"
    }

    PRODUCT {
        ObjectId _id PK "Auto-generated ObjectId"
        string name "Trimmed product title"
        string description "Detailed product description"
        number price "Non-negative float (min: 0)"
        string category "Indexed category name"
        string_array images "Array of Cloudinary CDN image URLs"
        number stock "Inventory quantity (min: 0, default: 0)"
        string sku UK "Unique Stock Keeping Unit (Uppercase)"
        boolean isActive "Soft-delete flag (default: true)"
        date createdAt "Timestamp"
        date updatedAt "Timestamp"
    }

    PRODUCT_VARIANT {
        string name "Variant attribute (e.g., 'Size', 'Color')"
        string_array options "Array of allowed options (e.g., ['8', '9', '10'])"
    }

    ORDER {
        ObjectId _id PK "Auto-generated ObjectId"
        ObjectId userId FK "Indexed, References USER._id"
        string orderNumber UK "Indexed, Unique identifier (ORD-timestamp-rand)"
        number subtotal "Sum of item (price * quantity)"
        number deliveryFee "Standard fixed delivery charge (40)"
        number totalAmount "Calculated: subtotal + deliveryFee"
        string paymentMethod "enum: 'UPI' | 'CARD' | 'COD'"
        string paymentStatus "enum: 'PENDING' | 'SUCCESS' | 'FAILED'"
        string orderStatus "enum: 'PENDING' | 'CONFIRMED' | 'CANCELLED'"
        date createdAt "Timestamp"
        date updatedAt "Timestamp"
    }

    ORDER_ITEM {
        ObjectId productId FK "References PRODUCT._id"
        string name "Product name snapshotted at purchase"
        string sku "Product SKU snapshotted at purchase"
        number price "Server-verified unit price at purchase"
        number quantity "Positive integer (min: 1)"
        map selectedVariants "Map of chosen variant options (e.g., Size: '10')"
    }

    SHIPPING_ADDRESS {
        string fullName "Recipient full name"
        string phone "Contact phone number"
        string addressLine "Street address or flat number"
        string city "City"
        string state "State or Province"
        string postalCode "Postal / PIN Code"
    }

    %% RELATIONSHIPS
    USER ||--o{ ORDER : "places (1:N foreign key)"
    ORDER ||--|{ ORDER_ITEM : "embeds array (1:N subdocuments)"
    ORDER ||--|| SHIPPING_ADDRESS : "embeds subdocument (1:1 subdocument)"
    ORDER_ITEM }o--|| PRODUCT : "references by ID (N:1 soft relation)"
    PRODUCT ||--o{ PRODUCT_VARIANT : "embeds array (1:N subdocuments)"
```

---

## 2. Cart Architecture & Client vs. Server Boundary

A fundamental architectural principle of ShopEase is the distinction between **ephemeral client state** and **durable server persistence**:

```mermaid
flowchart LR
    subgraph CLIENT_SIDE["Mobile Client (No MongoDB Cart Collection)"]
        direction TB
        USER_ACTION["User adds/removes item"]
        Z_STORE["Zustand Store (useCartStore)"]
        ASYNC_STORAGE[("AsyncStorage<br/>Local Key: cart-storage")]

        USER_ACTION --> Z_STORE
        Z_STORE <--> ASYNC_STORAGE
    end

    subgraph CHECKOUT_BOUNDARY["Checkout & Order Creation"]
        CHECKOUT_SUBMIT["POST /api/orders<br/>(Transmits full cart payload)"]
    end

    subgraph SERVER_SIDE["MongoDB Atlas Database"]
        direction TB
        ORDER_DOC[("Order Document<br/>paymentStatus: PENDING<br/>orderStatus: PENDING")]
        PAYMENT_SIM["POST /api/payments/process<br/>(Simulated Payment Outcome)"]

        TX_SUCCESS["outcome: 'SUCCESS'<br/>1. Atomic session transaction<br/>2. Product.stock: $inc -quantity<br/>3. orderStatus: CONFIRMED<br/>4. paymentStatus: SUCCESS"]
        TX_FAILED["outcome: 'FAILED'<br/>1. Stock untouched<br/>2. orderStatus: PENDING<br/>3. paymentStatus: FAILED<br/>4. Client cart strictly preserved"]
    end

    Z_STORE -- "On Proceed to Checkout" --> CHECKOUT_SUBMIT
    CHECKOUT_SUBMIT --> ORDER_DOC
    ORDER_DOC --> PAYMENT_SIM
    PAYMENT_SIM --> TX_SUCCESS
    PAYMENT_SIM --> TX_FAILED
    TX_SUCCESS -. "Clear local cart" .-> Z_STORE
    TX_FAILED -. "Keep cart for retry" .-> Z_STORE

    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef boundary fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef server fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d;

    class CLIENT_SIDE,USER_ACTION,Z_STORE,ASYNC_STORAGE client;
    class CHECKOUT_BOUNDARY,CHECKOUT_SUBMIT boundary;
    class SERVER_SIDE,ORDER_DOC,PAYMENT_SIM,TX_SUCCESS,TX_FAILED server;
```

---

## 3. Schema Details & Architectural Rationale

### A. User Collection (`backend/src/models/user.model.ts`)
- **Collection Name**: `users`
- **Authentication Credentials**: Passwords are encrypted with `bcryptjs` using 12 salt rounds before insertion. The schema enforces `select: false` so user queries omit password hashes by default.
- **Roles**: Strictly typed enum: `"customer"` (default for self-registered users) and `"admin"` (assigned via administrator promotion).

### B. Product Collection (`backend/src/models/product.model.ts`)
- **Collection Name**: `products`
- **Soft Deletion**: Includes an `isActive` boolean flag (defaults to `true`). Admin deletion marks `isActive: false`, excluding products from customer queries while preserving historic integrity for past order receipts.
- **Indexes**:
  - `sku`: Unique sparse index (`{ unique: true }`).
  - `category`: B-tree index for fast catalog filtering.
- **Embedded Variants**: Variants (`Size`, `Color`, `Finish`, etc.) are embedded directly inside the product document as `{ name: string, options: string[] }[]`.

### C. Order Collection (`backend/src/models/order.model.ts`)
- **Collection Name**: `orders`
- **Referenced Relations**:
  - `userId`: `Schema.Types.ObjectId` referencing `User` (`ref: "User"`). Used for customer data isolation and populated in administrator order feeds.
- **Embedded Subdocuments**:
  - `items` (`OrderItem[]`): Each line item stores `productId` alongside historical snapshots of `name`, `sku`, `price`, and `selectedVariants`. This ensures changes to the live product catalog never alter historic financial receipts.
  - `shippingAddress` (`ShippingAddress`): Embedded directly inside the order to preserve delivery destination details at the time of purchase.
- **Financial Immutability**:
  - `subtotal`: Computed on the server by summing `price * quantity` from database product records.
  - `deliveryFee`: Fixed `₹40` shipping fee.
  - `totalAmount`: Enforced as `subtotal + deliveryFee`.

### D. Simulated Payment Lifecycle
- **No Third-Party Gateway Dependencies**: Payment processing is simulated via `POST /api/payments/process` using an explicit outcome parameter (`SUCCESS` vs. `FAILED`).
- **Atomic Stock Deduction**: Stock deduction occurs inside a MongoDB session transaction (`session.withTransaction`) only when payment succeeds. If payment fails, product stock is not decremented, and the order remains `PENDING` so the user can re-attempt payment with the same items.
