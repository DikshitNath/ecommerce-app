
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";

type PaymentOutcome = "success" | "failure";

export default function PaymentFailureScreen() {
  const router = useRouter();

  const {
    orderId,
    paymentMethod,
    message,
  } = useLocalSearchParams<{
    orderId?: string;
    paymentMethod?: string;
    message?: string;
  }>();

  const [selectedOutcome, setSelectedOutcome] =
    useState<PaymentOutcome>("success");

  const [isRetrying, setIsRetrying] = useState(false);

  const displayMessage =
    message ||
    "We couldn't complete your payment. Your cart items are still saved. Please try again.";

  const handleRetry = () => {
    if (isRetrying) return;

    if (!orderId) {
      Alert.alert(
        "Order Not Found",
        "We couldn't identify your previous order. Please check your cart and start checkout again."
      );
      router.replace("/(tabs)/cart");
      return;
    }

    setIsRetrying(true);

    // Retry payment against the SAME backend order.
    // Do not create another order.
    router.replace({
      pathname: "/payment-processing",
      params: {
        orderId,
        paymentMethod: paymentMethod || "UPI",
        result: selectedOutcome,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✕</Text>

      <Text style={styles.heading}>
        Payment Not Completed
      </Text>

      <Text style={styles.description}>
        {displayMessage}
      </Text>

      {orderId ? (
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>
            Previous Order ID
          </Text>

          <Text style={styles.orderId}>
            {orderId}
          </Text>

          <Text style={styles.infoText}>
            Your existing order will be reused when you retry.
            No duplicate order will be created.
          </Text>
        </View>
      ) : (
        <Text style={styles.warningText}>
          Previous order information is unavailable.
          Please return to your cart.
        </Text>
      )}

      {orderId && (
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>
            Sandbox Payment Retry
          </Text>

          <Text style={styles.testDescription}>
            Choose an outcome to simulate the next payment attempt.
          </Text>

          <Pressable
            style={[
              styles.outcomeOption,
              selectedOutcome === "success" &&
                styles.selectedOutcome,
            ]}
            onPress={() => setSelectedOutcome("success")}
          >
            <Text
              style={[
                styles.outcomeText,
                selectedOutcome === "success" &&
                  styles.selectedOutcomeText,
              ]}
            >
              Simulate Successful Payment
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.outcomeOption,
              selectedOutcome === "failure" &&
                styles.selectedOutcome,
            ]}
            onPress={() => setSelectedOutcome("failure")}
          >
            <Text
              style={[
                styles.outcomeText,
                selectedOutcome === "failure" &&
                  styles.selectedOutcomeText,
              ]}
            >
              Simulate Failed Payment
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[
          styles.button,
          (!orderId || isRetrying) && styles.disabledButton,
        ]}
        onPress={handleRetry}
        disabled={!orderId || isRetrying}
      >
        <Text style={styles.buttonText}>
          {isRetrying ? "Retrying..." : "Retry Payment"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(tabs)/cart")}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>
          Return to Cart
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
    padding: 24,
    backgroundColor: "#F8FAFC",
  },

  icon: {
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
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    marginTop: 22,
  },

  orderLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

  orderId: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },

  infoText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 12,
  },

  warningText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },

  testSection: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },

  testTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  testDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 12,
  },

  outcomeOption: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 13,
    marginTop: 8,
    alignItems: "center",
  },

  selectedOutcome: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  outcomeText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },

  selectedOutcomeText: {
    color: "#2563EB",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#94A3B8",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  secondaryButton: {
    padding: 16,
    marginTop: 8,
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
