
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useCartStore } from "../stores/cart-store";
import { useOrderStore } from "../stores/order-store";
import type { PaymentMethod } from "../stores/order-store";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const { paymentMethod } = useLocalSearchParams<{
    paymentMethod?: string;
  }>();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const addOrder = useOrderStore((state) => state.addOrder);

  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = () => {
    if (isSaving) return;

    if (items.length === 0) {
      Alert.alert("Cart Empty", "No items available to save.");
      router.replace("/(tabs)");
      return;
    }

    setIsSaving(true);

    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const deliveryFee = 40;

    const validMethod: PaymentMethod =
      paymentMethod === "CARD" || paymentMethod === "COD"
        ? paymentMethod
        : "UPI";

    // Create a separate order record
    addOrder({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentMethod: validMethod,
    });

    // Clear cart only after saving the order
    clearCart();

    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>

      <Text style={styles.heading}>Order Confirmed!</Text>

      <Text style={styles.description}>
        Your order has been successfully placed.
        You can view it in your order history.
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleContinue}
        disabled={isSaving}
      >
        <Text style={styles.buttonText}>
          {isSaving ? "Saving Order..." : "Continue Shopping"}
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
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
    marginTop: 12,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
