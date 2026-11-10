
import {api} from "./api";

export type PaymentMethod = "UPI" | "CARD" | "COD";

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED";

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  selectedVariants: Record<string, string>;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    quantity: number;
    selectedVariants?: Record<string, string>;
  }[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    limit: number;
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: Order;
}

// Create a pending order.
export const createOrder = async (
  payload: CreateOrderInput
): Promise<Order> => {
  const response = await api.post<OrderResponse>(
    "/orders",
    payload
  );

  return response.data.data;
};

// Retrieve order history.
export const getOrders = async (
  page = 1,
  limit = 10
): Promise<OrdersResponse> => {
  const response = await api.get<OrdersResponse>(
    "/orders",
    {
      params: { page, limit },
    }
  );

  return response.data;
};

// Retrieve a specific order.
export const getOrderById = async (
  orderId: string
): Promise<Order> => {
  const response = await api.get<OrderResponse>(
    `/orders/${orderId}`
  );

  return response.data.data;
};

// Process simulated payment.
export const processOrderPayment = async (
  orderId: string,
  outcome: "SUCCESS" | "FAILED"
): Promise<Order> => {
  const response = await api.post<PaymentResponse>(
    "/payments/process",
    {
      orderId,
      outcome,
    }
  );

  return response.data.data;
};
