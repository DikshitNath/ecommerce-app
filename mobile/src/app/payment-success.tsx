
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useOrder } from "../hooks/use-orders";
import { useCartStore } from "../store/cart-store";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const { orderId } = useLocalSearchParams<{
    orderId?: string;
  }>();

  const clearCart = useCartStore((state) => state.clearCart);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useOrder(orderId ?? "");

  // Prevent clearing the cart more than once for this order.
  const clearedOrderId = useRef<string | null>(null);

  const isVerified =
    order?.paymentStatus === "SUCCESS" &&
    order?.orderStatus === "CONFIRMED";

  useEffect(() => {
    if (
      isVerified &&
      order &&
      clearedOrderId.current !== order._id
    ) {
      clearCart();
      clearedOrderId.current = order._id;
    }
  }, [isVerified, order, clearCart]);

  const handleContinueShopping = () => {
    router.replace("/(tabs)");
  };

  const handleViewOrder = () => {
    if (!order) return;

    router.replace({
      pathname: "/order-details",
      params: {
        orderId: order._id,
      },
    });
  };

  // Missing order ID.
  if (!orderId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.heading}>
          Order Information Missing
        </Text>

        <Text style={styles.description}>
          We couldn't identify your order. Please check your
          order history before trying again.
        </Text>

        <Pressable
          style={styles.button}
          onPress={handleContinueShopping}
        >
          <Text style={styles.buttonText}>
            Go to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  // Loading backend order verification.
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.heading}>
          Verifying Your Order
        </Text>

        <Text style={styles.description}>
          Please wait while we confirm your payment with
          the server.
        </Text>
      </View>
    );
  }

  // API or network error.
  if (isError || !order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.heading}>
          Unable to Verify Order
        </Text>

        <Text style={styles.description}>
          We couldn't retrieve your order details. Your cart
          has not been cleared. Please try again or check
          your order history.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Retry Verification
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.secondaryButtonText}>
            Go to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  // Do not show success if backend status is not confirmed.
  if (!isVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.heading}>
          Payment Not Confirmed
        </Text>

        <Text style={styles.description}>
          Your order has not been confirmed by the server.
          Please check your order status before attempting
          another payment.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Payment: {order.paymentStatus}
          </Text>

          <Text style={styles.statusText}>
            Order: {order.orderStatus}
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={handleViewOrder}
        >
          <Text style={styles.buttonText}>
            View Order Details
          </Text>
        </Pressable>
      </View>
    );
  }

  // Success UI: only displayed after backend verification.
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>

      <Text style={styles.heading}>
        Order Confirmed!
      </Text>

      <Text style={styles.description}>
        Your payment was successful and your order has
        been confirmed.
      </Text>

      <View style={styles.orderCard}>
        <Text style={styles.orderLabel}>
          Order Number
        </Text>

        <Text style={styles.orderNumber}>
          {order.orderNumber}
        </Text>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Payment Method
          </Text>

          <Text style={styles.detailValue}>
            {order.paymentMethod}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Payment Status
          </Text>

          <Text style={styles.successText}>
            {order.paymentStatus}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Order Status
          </Text>

          <Text style={styles.successText}>
            {order.orderStatus}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.totalLabel}>
            Total Paid
          </Text>

          <Text style={styles.totalValue}>
            ₹{order.totalAmount.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={handleViewOrder}
      >
        <Text style={styles.buttonText}>
          View Order Details
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={handleContinueShopping}
      >
        <Text style={styles.secondaryButtonText}>
          Continue Shopping
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: "#F8FAFC",
  },

  icon: {
    fontSize: 64,
    color: "#16A34A",
    fontWeight: "bold",
  },

  errorIcon: {
    fontSize: 64,
    color: "#DC2626",
    fontWeight: "bold",
  },

  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 20,
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
    marginTop: 12,
  },

  orderCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginTop: 26,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  orderLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  detailLabel: {
    fontSize: 13,
    color: "#64748B",
  },

  detailValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },

  successText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "700",
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#16A34A",
  },

  statusCard: {
    width: "100%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 20,
  },

  statusText: {
    color: "#475569",
    fontSize: 14,
    marginVertical: 4,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 26,
    width: "100%",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  secondaryButton: {
    padding: 15,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
