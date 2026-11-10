
import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useCartStore } from "../stores/cart-store";
import { useCreateOrder } from "../hooks/use-orders";

type PaymentMethod = "UPI" | "CARD" | "COD";
type PaymentOutcome = "SUCCESS" | "FAILED";

const DELIVERY_FEE = 40;

type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

export default function PaymentScreen() {
  const router = useRouter();

  const { shippingAddress } = useLocalSearchParams<{
    shippingAddress?: string;
  }>();

  const items = useCartStore((state) => state.items);

  const createOrderMutation = useCreateOrder();

  const isSubmittingRef = useRef(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("UPI");

  // Sandbox-only option for testing both payment outcomes.
  const [paymentOutcome, setPaymentOutcome] =
    useState<PaymentOutcome>("SUCCESS");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const estimatedTotal = subtotal + DELIVERY_FEE;

  const parseShippingAddress = (): ShippingAddress | null => {
    if (!shippingAddress) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        Array.isArray(shippingAddress)
          ? shippingAddress[0]
          : shippingAddress
      ) as ShippingAddress;

      const requiredFields: (keyof ShippingAddress)[] = [
        "fullName",
        "phone",
        "addressLine",
        "city",
        "state",
        "postalCode",
      ];

      const isValid = requiredFields.every(
        (field) =>
          typeof parsed[field] === "string" &&
          parsed[field].trim().length > 0
      );

      return isValid ? parsed : null;
    } catch {
      return null;
    }
  };

  const handlePayment = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      router.replace("/(tabs)/cart");
      return;
    }

    const address = parseShippingAddress();

    if (!address) {
      Alert.alert(
        "Invalid Address",
        "Your delivery address is missing or invalid. Please return to checkout."
      );
      return;
    }

    if (paymentMethod === "COD") {
      Alert.alert(
        "Coming Soon",
        "Cash on Delivery will be available after its backend flow is implemented."
      );
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      // Create a pending order on the backend.
      // The backend calculates the actual prices and total.
      const order = await createOrderMutation.mutateAsync({
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants,
        })),
        shippingAddress: address,
        paymentMethod,
      });

      // Navigate using the backend-generated order ID.
      router.push({
        pathname: "/payment-processing",
        params: {
          orderId: order._id,
          result: paymentOutcome.toLowerCase(),
          paymentMethod,
          totalAmount: String(order.totalAmount),
        },
      });
    } catch (error) {
      console.error("Order creation failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your order. Please try again.";

      Alert.alert("Order Failed", message);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const PaymentOption = ({
    title,
    description,
    value,
    disabled = false,
  }: {
    title: string;
    description: string;
    value: PaymentMethod;
    disabled?: boolean;
  }) => {
    const selected = paymentMethod === value;

    return (
      <Pressable
        onPress={() => {
          if (!disabled) {
            setPaymentMethod(value);
          }
        }}
        disabled={disabled || isSubmitting}
        style={[
          styles.paymentOption,
          selected && styles.selectedOption,
          disabled && styles.disabledOption,
        ]}
      >
        <View style={styles.optionContent}>
          <View style={styles.radioOuter}>
            {selected && <View style={styles.radioInner} />}
          </View>

          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>
              {title}
            </Text>

            <Text style={styles.optionDescription}>
              {description}
            </Text>
          </View>

          {disabled && (
            <Text style={styles.comingSoon}>
              Soon
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Payment</Text>

        <Text style={styles.sectionTitle}>
          Select Payment Method
        </Text>

        <PaymentOption
          title="UPI"
          description="Pay using Google Pay, PhonePe or Paytm"
          value="UPI"
        />

        <PaymentOption
          title="Credit / Debit Card"
          description="Visa, Mastercard and RuPay"
          value="CARD"
        />

        <PaymentOption
          title="Cash on Delivery"
          description="Currently unavailable"
          value="COD"
          disabled
        />

        {/* Sandbox payment testing */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>
            Sandbox Payment Testing
          </Text>

          <Text style={styles.testDescription}>
            Choose the simulated result to test both payment
            success and failure scenarios.
          </Text>

          <View style={styles.testOptions}>
            <Pressable
              onPress={() => setPaymentOutcome("SUCCESS")}
              disabled={isSubmitting}
              style={[
                styles.testOption,
                paymentOutcome === "SUCCESS" &&
                  styles.selectedTestOption,
              ]}
            >
              <Text
                style={[
                  styles.testOptionText,
                  paymentOutcome === "SUCCESS" &&
                    styles.selectedTestOptionText,
                ]}
              >
                Simulate Success
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentOutcome("FAILED")}
              disabled={isSubmitting}
              style={[
                styles.testOption,
                paymentOutcome === "FAILED" &&
                  styles.selectedTestOption,
              ]}
            >
              <Text
                style={[
                  styles.testOptionText,
                  paymentOutcome === "FAILED" &&
                    styles.selectedTestOptionText,
                ]}
              >
                Simulate Failure
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>
            Order Summary
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>
              ₹{subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>
              ₹{DELIVERY_FEE}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>
              Estimated Total
            </Text>

            <Text style={styles.totalValue}>
              ₹{estimatedTotal.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.note}>
            Final amount will be calculated and verified by
            the server before payment.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View>
          <Text style={styles.bottomLabel}>
            Estimated Amount
          </Text>

          <Text style={styles.bottomTotal}>
            ₹{estimatedTotal.toFixed(2)}
          </Text>
        </View>

        <Pressable
          style={[
            styles.payButton,
            (items.length === 0 || isSubmitting) &&
              styles.disabledButton,
          ]}
          onPress={handlePayment}
          disabled={items.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Create Order & Continue
            </Text>
          )}
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

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },

  paymentOption: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  selectedOption: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  disabledOption: {
    opacity: 0.55,
  },

  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  optionText: {
    marginLeft: 12,
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  optionDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  comingSoon: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

  testSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 12,
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
    marginTop: 6,
  },

  testOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  testOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },

  selectedTestOption: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },

  testOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  selectedTestOptionText: {
    color: "#2563EB",
  },

  summary: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginTop: 24,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    color: "#64748B",
  },

  value: {
    fontSize: 14,
    color: "#0F172A",
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
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 18,
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

  payButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 170,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#94A3B8",
  },

  payButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
