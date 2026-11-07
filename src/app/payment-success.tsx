
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../stores/cart-store";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  const handleContinue = () => {
    clearCart();
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>

      <Text style={styles.heading}>Payment Successful!</Text>

      <Text style={styles.description}>
        Your payment has been completed successfully.
        Thank you for shopping with us!
      </Text>

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue Shopping</Text>
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
