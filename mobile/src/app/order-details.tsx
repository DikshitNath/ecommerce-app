
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useOrder } from "../hooks/use-orders";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "../services/order.service";

export default function OrderDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    orderId: string;
  }>();

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  // Fetch order details from backend.
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOrder(orderId ?? "");

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString("en-IN")}`;

  const orderDate = order
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  // Order status styling.
  const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
        return styles.confirmed;

      case "CANCELLED":
        return styles.cancelled;

      default:
        return styles.pending;
    }
  };

  // Payment status styling.
  const getPaymentStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case "SUCCESS":
        return styles.paymentSuccess;

      case "FAILED":
        return styles.paymentFailed;

      default:
        return styles.paymentPending;
    }
  };

  // Loading state.
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>
          Loading order details...
        </Text>
      </View>
    );
  }

  // Error state.
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.emptyTitle}>
          Unable to Load Order
        </Text>

        <Text style={styles.emptyDescription}>
          {error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."}
        </Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>
              Try Again
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  // Order not found.
  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>
          Order Not Found
        </Text>

        <Text style={styles.emptyDescription}>
          We couldn't find this order.
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headingRow}>
        <Text style={styles.heading}>
          Order Details
        </Text>

        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <Text style={styles.refreshText}>
              Refresh
            </Text>
          )}
        </Pressable>
      </View>

      {/* Order Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Order Information
        </Text>

        <Text style={styles.label}>
          Order Number
        </Text>

        <Text style={styles.value}>
          {order.orderNumber}
        </Text>

        <Text style={styles.label}>
          Order Date
        </Text>

        <Text style={styles.value}>
          {orderDate}
        </Text>

        <Text style={styles.label}>
          Order ID
        </Text>

        <Text style={styles.smallValue}>
          {order._id}
        </Text>

        <Text style={styles.label}>
          Order Status
        </Text>

        <Text
          style={[
            styles.statusBadge,
            getOrderStatusStyle(order.orderStatus),
          ]}
        >
          {order.orderStatus}
        </Text>
      </View>

      {/* Order Tracking */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Order Tracking
        </Text>

        {order.orderStatus === "CANCELLED" ? (
          <Text style={styles.cancelledText}>
            This order has been cancelled.
          </Text>
        ) : (
          <View>
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[styles.dot, styles.activeDot]}
                />
                <View
                  style={[styles.line, styles.activeLine]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.activeTimelineText}>
                  Order Placed
                </Text>

                <Text style={styles.timelineDescription}>
                  Your order has been received.
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.dot,
                    order.paymentStatus === "SUCCESS" &&
                      styles.activeDot,
                    order.paymentStatus === "FAILED" &&
                      styles.failedDot,
                  ]}
                />

                <View
                  style={[
                    styles.line,
                    order.paymentStatus === "SUCCESS" &&
                      styles.activeLine,
                  ]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineText,
                    order.paymentStatus === "SUCCESS" &&
                      styles.activeTimelineText,
                    order.paymentStatus === "FAILED" &&
                      styles.failedTimelineText,
                  ]}
                >
                  Payment {order.paymentStatus}
                </Text>

                <Text style={styles.timelineDescription}>
                  {order.paymentStatus === "SUCCESS"
                    ? "Payment was successfully processed."
                    : order.paymentStatus === "FAILED"
                    ? "Payment could not be completed."
                    : "Waiting for payment confirmation."}
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.dot,
                    order.orderStatus === "CONFIRMED" &&
                      styles.activeDot,
                  ]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineText,
                    order.orderStatus === "CONFIRMED" &&
                      styles.activeTimelineText,
                  ]}
                >
                  Order Confirmed
                </Text>

                <Text style={styles.timelineDescription}>
                  {order.orderStatus === "CONFIRMED"
                    ? "Your order has been confirmed."
                    : "Your order is awaiting confirmation."}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Purchased Products */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Purchased Products
        </Text>

        {order.items.map((item, index) => (
          <View
            key={`${item.productId}-${index}`}
            style={styles.productRow}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {item.name}
              </Text>

              <Text style={styles.label}>
                SKU: {item.sku}
              </Text>

              <Text style={styles.label}>
                Quantity: {item.quantity}
              </Text>

              {Object.entries(
                item.selectedVariants ?? {}
              ).map(([name, value]) => (
                <Text
                  key={name}
                  style={styles.variant}
                >
                  {name}: {value}
                </Text>
              ))}

              <Text style={styles.unitPrice}>
                Unit price: {formatPrice(item.price)}
              </Text>
            </View>

            <Text style={styles.productTotal}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Shipping Address */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Address
        </Text>

        <Text style={styles.addressName}>
          {order.shippingAddress.fullName}
        </Text>

        <Text style={styles.addressText}>
          {order.shippingAddress.addressLine}
        </Text>

        <Text style={styles.addressText}>
          {order.shippingAddress.city},{" "}
          {order.shippingAddress.state}
        </Text>

        <Text style={styles.addressText}>
          PIN: {order.shippingAddress.postalCode}
        </Text>

        <Text style={styles.addressText}>
          Phone: {order.shippingAddress.phone}
        </Text>
      </View>

      {/* Payment Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Payment Details
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.label}>
            Payment Method
          </Text>

          <Text style={styles.value}>
            {order.paymentMethod}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>
            Payment Status
          </Text>

          <Text
            style={[
              styles.paymentStatus,
              getPaymentStatusStyle(order.paymentStatus),
            ]}
          >
            {order.paymentStatus}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>
            Subtotal
          </Text>

          <Text style={styles.value}>
            {formatPrice(order.subtotal)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.label}>
            Delivery Fee
          </Text>

          <Text style={styles.value}>
            {formatPrice(order.deliveryFee)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>
            Total Amount
          </Text>

          <Text style={styles.totalValue}>
            {formatPrice(order.totalAmount)}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.backToOrdersButton}
        onPress={() => router.replace("/(tabs)/orders")}
      >
        <Text style={styles.actionButtonText}>
          Back to My Orders
        </Text>
      </Pressable>
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

  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
  },

  refreshText: {
    color: "#2563EB",
    fontWeight: "600",
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

  smallValue: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 14,
  },

  statusBadge: {
    alignSelf: "flex-start",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: "hidden",
  },

  confirmed: {
    color: "#15803D",
    backgroundColor: "#DCFCE7",
  },

  pending: {
    color: "#B45309",
    backgroundColor: "#FEF3C7",
  },

  cancelled: {
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
  },

  paymentStatus: {
    fontSize: 13,
    fontWeight: "700",
  },

  paymentSuccess: {
    color: "#15803D",
  },

  paymentFailed: {
    color: "#DC2626",
  },

  paymentPending: {
    color: "#B45309",
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 65,
  },

  timelineIndicator: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },

  timelineContent: {
    flex: 1,
    paddingBottom: 15,
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

  failedDot: {
    backgroundColor: "#DC2626",
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

  failedTimelineText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  timelineDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  cancelledText: {
    color: "#DC2626",
    fontWeight: "600",
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  productInfo: {
    flex: 1,
    marginRight: 12,
  },

  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 7,
  },

  variant: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 5,
  },

  unitPrice: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  productTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  addressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },

  addressText: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    color: "#64748B",
    marginTop: 12,
  },

  errorIcon: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#DC2626",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 12,
  },

  emptyDescription: {
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },

  actionButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 20,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  backButton: {
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 20,
  },

  backToOrdersButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
});
