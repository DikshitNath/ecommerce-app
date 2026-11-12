import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
};

export type SelectedVariants = Record<string, string>;

export type CartItem = CartProduct & {
  cartItemId: string;
  selectedVariants: SelectedVariants;
  quantity: number;
};

type CartState = {
  items: CartItem[];

  addToCart: (
    product: CartProduct,
    quantity?: number,
    selectedVariants?: SelectedVariants
  ) => void;

  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
};

// Creates a unique ID for each product + variant combination.
const createCartItemId = (
  productId: string,
  variants: SelectedVariants
) => {
  const variantKey = Object.entries(variants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value}`)
    .join("|");

  return `${productId}::${variantKey || "default"}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addToCart: (product, requestedQuantity = 1, selectedVariants = {}) =>
        set((state) => {
          if (product.stock <= 0 || requestedQuantity <= 0) {
            return state;
          }

          const cartItemId = createCartItemId(
            product.id,
            selectedVariants
          );

          const existingItem = state.items.find(
            (item) => item.cartItemId === cartItemId
          );

          // Calculate quantity across ALL variants of this product.
          const currentProductQuantity = state.items
            .filter((item) => item.id === product.id)
            .reduce((total, item) => total + item.quantity, 0);

          const remainingStock = Math.max(
            0,
            product.stock - currentProductQuantity
          );

          const quantityToAdd = Math.min(
            requestedQuantity,
            remainingStock
          );

          if (quantityToAdd <= 0) return state;

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? {
                    ...item,
                    stock: product.stock,
                    quantity: item.quantity + quantityToAdd,
                  }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...product,
                cartItemId,
                selectedVariants,
                quantity: quantityToAdd,
              },
            ],
          };
        }),

      increaseQuantity: (cartItemId) =>
        set((state) => {
          const targetItem = state.items.find(
            (item) => item.cartItemId === cartItemId
          );

          if (!targetItem) return state;

          const currentProductQuantity = state.items
            .filter((item) => item.id === targetItem.id)
            .reduce((total, item) => total + item.quantity, 0);

          if (currentProductQuantity >= targetItem.stock) {
            return state;
          }

          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }),

      decreaseQuantity: (cartItemId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      updateQuantity: (cartItemId, requestedQuantity) =>
        set((state) => {
          const targetItem = state.items.find(
            (item) => item.cartItemId === cartItemId
          );

          if (!targetItem) return state;

          const otherVariantsQuantity = state.items
            .filter(
              (item) =>
                item.id === targetItem.id &&
                item.cartItemId !== cartItemId
            )
            .reduce((total, item) => total + item.quantity, 0);

          const availableStock = Math.max(
            0,
            targetItem.stock - otherVariantsQuantity
          );

          const quantity = Math.min(
            Math.max(0, Math.floor(requestedQuantity)),
            availableStock
          );

          return {
            items: state.items
              .map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, quantity }
                  : item
              )
              .filter((item) => item.quantity > 0),
          };
        }),

      removeFromCart: (cartItemId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.cartItemId !== cartItemId
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "shopping-cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,

      // Keep existing saved cart items compatible with the new structure.
      migrate: (persistedState: any) => {
        const oldItems = persistedState?.items ?? [];

        return {
          ...persistedState,
          items: oldItems.map((item: any) => {
            const selectedVariants = item.selectedVariants ?? {};

            return {
              ...item,
              cartItemId:
                item.cartItemId ??
                createCartItemId(item.id, selectedVariants),
              selectedVariants,
              // Older saved items did not store stock.
              // Preserve their existing quantity without allowing
              // an increase until refreshed with current product data.
              stock: item.stock ?? item.quantity,
            };
          }),
        };
      },
    }
  )
);