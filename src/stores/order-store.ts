
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMethod = "UPI" | "CARD" | "COD";

export type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
};

type OrderState = {
  orders: Order[];
  addOrder: (
    order: Omit<Order, "id" | "createdAt" | "status">
  ) => void;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => void;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],

      addOrder: (orderData) =>
        set((state) => ({
          orders: [
            {
              ...orderData,
              id: `ORD-${Date.now()}`,
              createdAt: new Date().toISOString(),
              status: "Processing",
            },
            ...state.orders,
          ],
        })),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status }
              : order
          ),
        })),
    }),
    {
      name: "order-history-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
