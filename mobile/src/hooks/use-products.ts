import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  ProductFilters,
} from "@/services/product.service";

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
  });
};