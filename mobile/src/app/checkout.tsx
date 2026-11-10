
import { useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";
import { useCartStore } from "../stores/cart-store";

const DELIVERY_FEE = 40;

// Temporary address.
// We will replace this with selectable saved addresses later.
const SHIPPING_ADDRESS = {
  fullName: "Dikshit Nath",
  phone: "9876543210",
  addressLine: "123, Sample Street",
  city: "Jalandhar",
  state: "Punjab",
  postalCode: "144001",
};

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);

  // Calculate estimated subtotal.
  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  // Total quantity across all cart entries.
  const totalItems = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [items]
  );

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  // Continue to payment.
  const handleContinue = () => {
    if (items.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Please add products before checkout."
      );
      return;
    }

    // Pass address to payment screen.
    router.push({
      pathname: "/payment",
      params: {
        shippingAddress: JSON.stringify(SHIPPING_ADDRESS),
      },
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: (typeof items)[number] }) => (
          <View style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {item.name}
              </Text>

              <Text style={styles.quantity}>
                Quantity: {item.quantity}
              </Text>

              {(
                Object.entries(
                  item.selectedVariants ?? {}
                ) as [string, string][]
              ).map(([name, value]) => (
                <Text
                  key={name}
                  style={styles.variant}
                >
                  {name}: {value}
                </Text>
              ))}

              <Text style={styles.unitPrice}>
                Unit price: ₹{item.price.toLocaleString("en-IN")}
              </Text>
            </View>

            <Text style={styles.productPrice}>
              ₹{(
                item.price * item.quantity
              ).toLocaleString("en-IN")}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>
              Checkout
            </Text>

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>

              <View style={styles.addressCard}>
                <Text style={styles.name}>
                  {SHIPPING_ADDRESS.fullName}
                </Text>

                <Text style={styles.addressText}>
                  {SHIPPING_ADDRESS.addressLine}
                </Text>

                <Text style={styles.addressText}>
                  {SHIPPING_ADDRESS.city},{" "}
                  {SHIPPING_ADDRESS.state} -{" "}
                  {SHIPPING_ADDRESS.postalCode}
                </Text>

                <Text style={styles.addressText}>
                  Phone: {SHIPPING_ADDRESS.phone}
                </Text>

                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Address",
                      "Address selection will be implemented later."
                    )
                  }
                >
                  <Text style={styles.changeText}>
                    Change Address
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Order Summary ({totalItems} items)
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Your cart is empty
            </Text>

            <Text style={styles.emptyText}>
              Add some products to continue shopping.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.checkoutButtonText}>
                Start Shopping
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Price Details
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Subtotal
                </Text>

                <Text style={styles.priceValue}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Delivery Fee
                </Text>

                <Text style={styles.priceValue}>
                  ₹{deliveryFee}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>
                  Estimated Total
                </Text>

                <Text style={styles.totalValue}>
                  ₹{total.toLocaleString("en-IN")}
                </Text>
              </View>

              <Text style={styles.note}>
                Final prices and stock availability will be
                verified by the server.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom Checkout Button */}
      {items.length > 0 && (
        <View style={styles.bottomContainer}>
          <View>
            <Text style={styles.bottomLabel}>
              Estimated Total
            </Text>

            <Text style={styles.bottomTotal}>
              ₹{total.toLocaleString("en-IN")}
            </Text>
          </View>

          <Pressable
            style={styles.checkoutButton}
            onPress={handleContinue}
          >
            <Text style={styles.checkoutButtonText}>
              Continue to Payment
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  listContent: {
    padding: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 24,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  addressCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  addressText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 4,
  },

  changeText: {
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 10,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },

  productInfo: {
    flex: 1,
    marginRight: 12,
  },

  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  quantity: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },

  variant: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },

  unitPrice: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  emptyText: {
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },

  shopButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  priceLabel: {
    fontSize: 14,
    color: "#64748B",
  },

  priceValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  note: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },

  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },

  bottomLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  bottomTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },

  checkoutButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
