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


export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  sku: string;
  variants: ProductVariant[];
}

interface SingleProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

// Admin: Create a product
export const createProduct = async (
  payload: ProductInput
): Promise<Product> => {
  const response = await api.post<SingleProductResponse>(
    "/products",
    payload
  );

  return response.data.data;
};

// Admin: Update a product
export const updateProduct = async (
  id: string,
  payload: Partial<ProductInput>
): Promise<Product> => {
  const response = await api.put<SingleProductResponse>(
    `/products/${id}`,
    payload
  );

  return response.data.data;
};

// Admin: Soft-delete a product
export const deleteProduct = async (
  id: string
): Promise<Product> => {
  const response = await api.delete<SingleProductResponse>(
    `/products/${id}`
  );

  return response.data.data;
};
