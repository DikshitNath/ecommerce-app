import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminOrder } from "@/hooks/use-orders";
import type { OrderStatus, PaymentStatus } from "@/services/order.service";

export default function AdminOrderDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId: string }>();

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAdminOrder(orderId ?? "");

  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        refetch();
      }
    }, [orderId, refetch])
  );

  if (!orderId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Invalid Order</Text>
        <Text style={styles.stateText}>No order ID was provided.</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.replace("/admin-orders")}
        >
          <Text style={styles.actionButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getOrderStatusStyle = (status?: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
        return styles.badgeConfirmed;
      case "CANCELLED":
        return styles.badgeCancelled;
      default:
        return styles.badgePending;
    }
  };

  const getPaymentStatusStyle = (status?: PaymentStatus) => {
    switch (status) {
      case "SUCCESS":
        return styles.paymentSuccess;
      case "FAILED":
        return styles.paymentFailed;
      default:
        return styles.paymentPending;
    }
  };

  const customerName =
    typeof order?.userId === "object" && order.userId?.name
      ? order.userId.name
      : order?.shippingAddress?.fullName || "Customer";

  const customerEmail =
    typeof order?.userId === "object" && order.userId?.email
      ? order.userId.email
      : "Not provided";

  const customerId =
    typeof order?.userId === "object" && order.userId?._id
      ? order.userId._id
      : typeof order?.userId === "string"
      ? order.userId
      : "N/A";

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Loading order details...</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to load order</Text>
        <Text style={styles.stateText}>
          {error instanceof Error ? error.message : "Order not found."}
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => refetch()}
        >
          <Text style={styles.actionButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 14) + 6 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Orders</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={async () => {
              await refetch();
            }}
            colors={["#2563EB"]}
          />
        }
      >
        {/* Order Status Banner */}
        <View style={styles.statusBanner}>
          <View>
            <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
            <Text style={styles.dateText}>Placed: {formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.bannerBadges}>
            <View style={[styles.badge, getOrderStatusStyle(order.orderStatus)]}>
              <Text style={styles.badgeText}>{order.orderStatus}</Text>
            </View>
            <View style={[styles.badge, getPaymentStatusStyle(order.paymentStatus)]}>
              <Text style={styles.badgeText}>{order.paymentStatus}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{customerEmail}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer ID</Text>
            <Text style={[styles.infoValue, styles.monoText]}>{customerId}</Text>
          </View>
        </View>

        {/* Ordered Products Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Ordered Products ({order.items.reduce((s, i) => s + i.quantity, 0)})
          </Text>

          {order.items.map((item, index) => {
            const variantEntries = Object.entries(item.selectedVariants || {});

            return (
              <View
                key={`${item.productId}-${index}`}
                style={[
                  styles.productItem,
                  index > 0 && styles.productItemBorder,
                ]}
              >
                <View style={styles.productMainRow}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>

                <View style={styles.productSubRow}>
                  <Text style={styles.skuText}>SKU: {item.sku}</Text>
                  <Text style={styles.qtyText}>
                    {formatPrice(item.price)} × {item.quantity}
                  </Text>
                </View>

                {variantEntries.length > 0 && (
                  <View style={styles.variantContainer}>
                    {variantEntries.map(([key, val]) => (
                      <View key={key} style={styles.variantChip}>
                        <Text style={styles.variantChipText}>
                          {key}: {val}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Shipping Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <Text style={styles.addressName}>
            {order.shippingAddress.fullName}
          </Text>
          <Text style={styles.addressPhone}>
            Phone: {order.shippingAddress.phone}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress.addressLine}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
            {order.shippingAddress.postalCode}
          </Text>
        </View>

        {/* Payment & Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment & Cost Breakdown</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <View style={[styles.badge, getPaymentStatusStyle(order.paymentStatus)]}>
              <Text style={styles.badgeText}>{order.paymentStatus}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subtotal</Text>
            <Text style={styles.infoValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Fee</Text>
            <Text style={styles.infoValue}>
              {order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    fontFamily: "monospace",
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  bannerBadges: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeConfirmed: {
    backgroundColor: "#DCFCE7",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeCancelled: {
    backgroundColor: "#FEE2E2",
  },
  paymentSuccess: {
    backgroundColor: "#DCFCE7",
  },
  paymentPending: {
    backgroundColor: "#FEF3C7",
  },
  paymentFailed: {
    backgroundColor: "#FEE2E2",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  productItem: {
    paddingVertical: 10,
  },
  productItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  productMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563EB",
  },
  productSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  skuText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  qtyText: {
    fontSize: 12,
    color: "#475569",
  },
  variantContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  variantChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  variantChipText: {
    fontSize: 11,
    color: "#475569",
  },
  addressName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
  },
  addressPhone: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
    marginBottom: 6,
  },
  addressLine: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2563EB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  stateText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  actionButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
