
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useOrderStore } from "../stores/order-store";

export default function OrderDetailsScreen() {
  const router = useRouter();

  const { orderId } = useLocalSearchParams<{
    orderId: string;
  }>();

  const order = useOrderStore((state) =>
    state.orders.find((item) => item.id === orderId)
  );

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Order Not Found</Text>
        <Text style={styles.emptyDescription}>
          We couldn't find this order.
        </Text>
        <Text style={styles.backButton} onPress={() => router.back()}>
          Go Back
        </Text>
      </View>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const statusSteps = [
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Order Details</Text>

        {/* Order Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{order.id}</Text>

          <Text style={styles.label}>Order Date</Text>
          <Text style={styles.value}>{orderDate}</Text>

          <Text style={styles.label}>Order Status</Text>
          <Text style={styles.status}>{order.status}</Text>
        </View>

        {/* Order Tracking */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Tracking</Text>

          {order.status === "Cancelled" ? (
            <Text style={styles.cancelledText}>
              This order has been cancelled.
            </Text>
          ) : (
            statusSteps.map((step, index) => {
              const completed = index <= currentStep;

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.dot,
                        completed && styles.activeDot,
                      ]}
                    />
                    {index !== statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.line,
                          index < currentStep && styles.activeLine,
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.timelineText,
                      completed && styles.activeTimelineText,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Products */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Purchased Products</Text>

          {order.items.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.label}>
                  Quantity: {item.quantity}
                </Text>
              </View>

              <Text style={styles.value}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>
              ₹{order.subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>
              ₹{order.deliveryFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₹{order.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 14,
  },
  status: {
    color: "#B45309",
    fontWeight: "700",
    fontSize: 14,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 48,
  },
  timelineIndicator: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#CBD5E1",
  },
  activeDot: {
    backgroundColor: "#16A34A",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 3,
  },
  activeLine: {
    backgroundColor: "#16A34A",
  },
  timelineText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTimelineText: {
    color: "#15803D",
    fontWeight: "700",
  },
  cancelledText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
  },
  emptyDescription: {
    color: "#64748B",
    marginTop: 8,
  },
  backButton: {
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 20,
  },
});
