import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CartItem } from "../../store/cart-store";
import { useCartStore } from "../../store/cart-store";
import ProductImage from "../../components/ProductImage";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart
  );

  const router = useRouter();

  // Calculate subtotal of all cart entries.
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate total quantity across all products and variants.
  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <FlatList<CartItem>
      data={items}
      keyExtractor={(item) => item.cartItemId}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14) + 6,
          paddingBottom: 80 + insets.bottom,
        },
      ]}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>Shopping Cart</Text>
          <Text style={styles.subtitle}>
            {items.length === 0
              ? "Your cart is currently empty"
              : `${totalItems} ${totalItems === 1 ? "item" : "items"} ready for checkout`}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyCartEmoji}>🛒</Text>
          </View>

          <Text style={styles.emptyTitle}>Your cart is empty</Text>

          <Text style={styles.emptyText}>
            Looks like you haven&apos;t added any items to your cart yet.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.shopButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopButtonText}>Explore Products</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }: { item: CartItem }) => {
        // Calculate quantity across every variant of this product.
        const productTotalQuantity = items
          .filter((cartItem) => cartItem.id === item.id)
          .reduce(
            (total, cartItem) => total + cartItem.quantity,
            0
          );

        // Stock belongs to the product, not an individual variant.
        const isLimitReached = productTotalQuantity >= item.stock;

        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ProductImage
                uri={item.images?.[0]}
                style={styles.cartThumbnail}
                resizeMode="cover"
              />
              <View style={styles.cartInfoColumn}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.price}>
                  ₹{item.price.toLocaleString("en-IN")}
                </Text>

                {item.selectedVariants &&
                  Object.keys(item.selectedVariants).length > 0 && (
                    <Text style={styles.variant}>
                      {Object.entries(item.selectedVariants)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" | ")}
                    </Text>
                  )}

                <Text style={styles.stock}>
                  In Stock ({item.stock} available)
                </Text>
              </View>
            </View>

            {/* Quantity and Remove Row */}
            <View style={styles.controls}>
              <View style={styles.quantityControlsWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quantityButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => decreaseQuantity(item.cartItemId)}
                  accessibilityLabel="Decrease quantity"
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </Pressable>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.quantityButton,
                    isLimitReached && styles.disabledButton,
                    pressed && !isLimitReached && styles.buttonPressed,
                  ]}
                  disabled={isLimitReached}
                  onPress={() => increaseQuantity(item.cartItemId)}
                  accessibilityLabel="Increase quantity"
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => removeFromCart(item.cartItemId)}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>

            {isLimitReached && (
              <Text style={styles.limitText}>
                Maximum available stock reached ({item.stock})
              </Text>
            )}

            <View style={styles.itemTotalRow}>
              <Text style={styles.itemTotalLabel}>Item Total</Text>
              <Text style={styles.itemTotal}>
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        );
      }}
      ListFooterComponent={
        items.length > 0 ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{totalItems}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryPrice}>
                ₹{subtotal.toLocaleString("en-IN")}
              </Text>
            </View>

            <Text style={styles.delivery}>
              Delivery charges and taxes calculated at checkout.
            </Text>

            <Pressable
              onPress={() => router.push("/checkout")}
              style={({ pressed }) => [
                styles.checkoutButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
            >
              <Text style={styles.checkoutText}>
                Proceed to Checkout (₹{subtotal.toLocaleString("en-IN")})
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 8,
  },
  cartThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  cartInfoColumn: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
  },
  price: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  variant: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  stock: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  quantityControlsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  disabledButton: {
    opacity: 0.4,
  },
  quantity: {
    fontWeight: "800",
    fontSize: 16,
    color: "#0F172A",
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  removeText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },
  limitText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  itemTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 14,
    paddingTop: 12,
  },
  itemTotalLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  itemTotal: {
    fontWeight: "700",
    fontSize: 14,
    color: "#0F172A",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyCartEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  summary: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  summaryPrice: {
    fontWeight: "800",
    fontSize: 16,
    color: "#0F172A",
  },
  delivery: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shopButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  checkoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
