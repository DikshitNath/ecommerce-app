
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

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);

  // Calculate subtotal from the global cart
  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const total = subtotal + DELIVERY_FEE;

  const handleContinue = () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add products before checkout.");
      return;
    }

    // Payment screen will be implemented next
    Alert.alert("Checkout", "Payment integration is coming next!");
  };

  const renderItem = ({ item }: { item: (typeof items)[number] }) => (
    <View style={styles.productRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.quantity}>
          Quantity: {item.quantity}
        </Text>
      </View>

      <Text style={styles.productPrice}>
        ₹{item.price * item.quantity}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Checkout</Text>

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>

              <View style={styles.addressCard}>
                <Text style={styles.name}>Dikshit Nath</Text>
                <Text style={styles.addressText}>
                  123, Sample Street, Jalandhar, Punjab - 144001
                </Text>
                <Text style={styles.addressText}>Phone: +91 98765 43210</Text>

                <Pressable
                  onPress={() =>
                    Alert.alert("Address", "Address selection coming soon!")
                  }
                >
                  <Text style={styles.changeText}>Change Address</Text>
                </Pressable>
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Order Summary ({items.length} products)
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Your cart is empty. Add some products to continue.
          </Text>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Details</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>₹{DELIVERY_FEE}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Bottom Checkout Button */}
      <View style={styles.bottomContainer}>
        <View>
          <Text style={styles.bottomLabel}>Total Amount</Text>
          <Text style={styles.bottomTotal}>₹{total.toFixed(2)}</Text>
        </View>

        <Pressable
          style={[
            styles.checkoutButton,
            items.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutButtonText}>
            Continue to Payment
          </Text>
        </Pressable>
      </View>
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
    alignItems: "center",
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
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    paddingVertical: 30,
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
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
