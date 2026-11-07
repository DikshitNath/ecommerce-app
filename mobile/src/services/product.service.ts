import { api } from "./api";

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  sku: string;
  variants: ProductVariant[];
  isActive: boolean;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
}

export const getProducts = async (
  filters?: ProductFilters
): Promise<Product[]> => {
  const response = await api.get<ProductsResponse>("/products", {
    params: {
      search: filters?.search || undefined,
      category: filters?.category || undefined,
    },
  });

  return response.data.data;
};

export const getProductById = async (
  id: string
): Promise<Product> => {
  const response = await api.get<{ success: boolean; data: Product }>(
    `/products/${id}`
  );

  return response.data.data;
};