
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import { useOrders } from "../../hooks/use-orders";
import type { Order } from "../../services/order.service";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

export default function OrdersScreen() {
  const router = useRouter();

  // Fetch orders directly from the backend.
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOrders(1, 20);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const orders = data?.data ?? [];

  // Format order date.
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency.
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // Order status styling.
  const getOrderStatusStyle = (status: Order["orderStatus"]) => {
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
  const getPaymentStatusStyle = (
    status: Order["paymentStatus"]
  ) => {
    switch (status) {
      case "SUCCESS":
        return styles.paymentSuccess;

      case "FAILED":
        return styles.paymentFailed;

      default:
        return styles.paymentPending;
    }
  };

  // Render individual order.
  const renderOrder = ({ item }: { item: Order }) => {
    return (
      <Pressable
        style={styles.orderCard}
        onPress={() =>
          router.push({
            pathname: "/order-details",
            params: { orderId: item._id },
          })
        }
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>
              {item.orderNumber}
            </Text>

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.status,
              getOrderStatusStyle(item.orderStatus),
            ]}
          >
            {item.orderStatus}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Products */}
        {item.items.map((product, index) => (
          <View
            key={`${product.productId}-${index}`}
            style={styles.productContainer}
          >
            <View style={styles.productRow}>
              <Text style={styles.productName}>
                {product.name} × {product.quantity}
              </Text>

              <Text style={styles.productPrice}>
                {formatPrice(product.price * product.quantity)}
              </Text>
            </View>

            {/* Selected variants */}
            {Object.entries(product.selectedVariants ?? {}).map(
              ([variantName, variantValue]) => (
                <Text
                  key={variantName}
                  style={styles.variant}
                >
                  {variantName}: {variantValue}
                </Text>
              )
            )}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Payment Information */}
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentMethod}>
              Payment: {item.paymentMethod}
            </Text>

            <Text
              style={[
                styles.paymentStatus,
                getPaymentStatusStyle(item.paymentStatus),
              ]}
            >
              {item.paymentStatus}
            </Text>
          </View>

          <Text style={styles.total}>
            {formatPrice(item.totalAmount)}
          </Text>
        </View>

        <Text style={styles.detailsLink}>
          View Details →
        </Text>
      </Pressable>
    );
  };

  // Loading state.
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading your orders...
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
          Unable to Load Orders
        </Text>

        <Text style={styles.emptyDescription}>
          {error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."}
        </Text>

        <Pressable
          style={styles.shopButton}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.shopButtonText}>
              Try Again
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.heading}>
          My Orders
        </Text>

        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
          style={styles.refreshButton}
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

      <FlatList<Order>
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              No Orders Yet
            </Text>

            <Text style={styles.emptyDescription}>
              Your purchases will appear here once you place an order.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.shopButtonText}>
                Start Shopping
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          orders.length > 0 ? (
            <Text style={styles.footerText}>
              Showing {orders.length} orders
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 20,
  },

  headingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 18,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
  },

  refreshButton: {
    padding: 8,
  },

  refreshText: {
    color: "#2563EB",
    fontWeight: "600",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderInfo: {
    flex: 1,
    marginRight: 10,
  },

  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  date: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  status: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
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

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },

  productContainer: {
    marginBottom: 10,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  productName: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    marginRight: 10,
  },

  productPrice: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },

  variant: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentMethod: {
    fontSize: 12,
    color: "#64748B",
  },

  paymentStatus: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
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

  total: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },

  detailsLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 12,
    textAlign: "right",
  },

  centerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 100,
  },

  emptyIcon: {
    fontSize: 55,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },

  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },

  shopButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  footerText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginVertical: 12,
  },
});
