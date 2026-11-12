
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useRouter } from "expo-router";
import { useCartStore } from "../store/cart-store";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  hasVariants: boolean;
};

export default function ProductCard({
  id,
  name,
  price,
  description,
  stock,
  hasVariants,
}: ProductCardProps) {
  const router = useRouter();

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  // Find all cart entries belonging to this product.
  // Subscribe to the original cart items array.
  const items = useCartStore((state) => state.items);

  // Derive product-specific entries outside the Zustand selector.
  const productItems = items.filter((item) => item.id === id);

  const totalQuantity = productItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isOutOfStock = stock <= 0;
  const isLimitReached = totalQuantity >= stock;

  // Products with variants must be configured on their details page.
  const requiresVariants = hasVariants;

  const handleAdd = () => {
    if (isOutOfStock) return;

    if (requiresVariants) {
      router.push({
        pathname: "/product-details",
        params: { id },
      });
      return;
    }

    addToCart({
      id,
      name,
      price,
      description,
      stock,
    });
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/product-details",
            params: { id },
          })
        }
      >
        <Text style={styles.name}>{name}</Text>

        <Text style={styles.price}>
          ₹{price.toLocaleString("en-IN")}
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>

        <Text
          style={[
            styles.stock,
            isOutOfStock && styles.outOfStock,
          ]}
        >
          {isOutOfStock
            ? "Out of stock"
            : `${stock} available`}
        </Text>

        <Text style={styles.detailsLink}>
          View details →
        </Text>
      </Pressable>

      {isOutOfStock ? (
        <View style={styles.disabledButton}>
          <Text style={styles.disabledText}>
            Out of Stock
          </Text>
        </View>
      ) : requiresVariants ? (
        <Pressable
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Text style={styles.buttonText}>
            Select Options
          </Text>
        </Pressable>
      ) : totalQuantity === 0 ? (
        <Pressable
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Text style={styles.buttonText}>
            Add to Cart
          </Text>
        </Pressable>
      ) : (
        <View>
          <View style={styles.quantityContainer}>
            <Pressable
              style={styles.quantityButton}
              onPress={() =>
                decreaseQuantity(productItems[0].cartItemId)
              }
            >
              <Text>-</Text>
            </Pressable>

            <Text style={styles.quantity}>
              {totalQuantity}
            </Text>

            <Pressable
              style={[
                styles.quantityButton,
                isLimitReached && styles.disabledButton,
              ]}
              disabled={isLimitReached}
              onPress={() =>
                increaseQuantity(productItems[0].cartItemId)
              }
            >
              <Text>+</Text>
            </Pressable>
          </View>

          {productItems.length > 1 && (
            <Text style={styles.variantNote}>
              Multiple variants in cart. Manage them in Cart.
            </Text>
          )}

          {isLimitReached && (
            <Text style={styles.limitText}>
              Maximum available stock reached
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  price: {
    fontSize: 20,
    color: "#2563EB",
    marginTop: 10,
  },
  description: {
    color: "gray",
    marginTop: 5,
  },
  stock: {
    color: "#16A34A",
    marginTop: 8,
    fontSize: 13,
  },
  outOfStock: {
    color: "#DC2626",
  },
  detailsLink: {
    color: "#2563EB",
    marginTop: 10,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  disabledText: {
    color: "#475569",
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 15,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
  },
  quantity: {
    fontSize: 18,
    fontWeight: "bold",
  },
  variantNote: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },
  limitText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 8,
  },
});
