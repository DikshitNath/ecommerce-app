
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrder,
  getOrders,
  getOrderById,
  processOrderPayment,
  getAdminOrders,
  getAdminOrderById,
} from "../services/order.service";

import type {
  CreateOrderInput,
} from "../services/order.service";

// Query keys
export const orderKeys = {
  all: ["orders"] as const,

  lists: () => [...orderKeys.all, "list"] as const,

  list: (page: number, limit: number) =>
    [...orderKeys.lists(), { page, limit }] as const,

  details: () => [...orderKeys.all, "detail"] as const,

  detail: (orderId: string) =>
    [...orderKeys.details(), orderId] as const,

  adminLists: () => [...orderKeys.all, "admin", "list"] as const,

  adminList: (page: number, limit: number, status?: string, search?: string) =>
    [...orderKeys.adminLists(), { page, limit, status, search }] as const,

  adminDetails: () => [...orderKeys.all, "admin", "detail"] as const,

  adminDetail: (orderId: string) =>
    [...orderKeys.adminDetails(), orderId] as const,
};

// Fetch order history
export function useOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: orderKeys.list(page, limit),
    queryFn: () => getOrders(page, limit),
    staleTime: 30 * 1000,
  });
}

// Fetch individual order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

// Fetch all customer orders (Admin only)
export function useAdminOrders(page = 1, limit = 10, status = "ALL", search = "") {
  return useQuery({
    queryKey: orderKeys.adminList(page, limit, status, search),
    queryFn: () => getAdminOrders(page, limit, status, search),
    staleTime: 15 * 1000,
  });
}

// Fetch individual order details (Admin only)
export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.adminDetail(orderId),
    queryFn: () => getAdminOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

// Create pending order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderInput) =>
      createOrder(payload),

    onSuccess: (order) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists(),
      });

      queryClient.setQueryData(
        orderKeys.detail(order._id),
        order
      );
    },
  });
}

// Process payment
export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      outcome,
    }: {
      orderId: string;
      outcome: "SUCCESS" | "FAILED";
    }) => processOrderPayment(orderId, outcome),

    onSuccess: (order) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists(),
      });

      queryClient.setQueryData(
        orderKeys.detail(order._id),
        order
      );
    },
  });
}
