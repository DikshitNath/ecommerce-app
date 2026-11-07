
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function PaymentFailureScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✕</Text>

      <Text style={styles.heading}>Payment Failed</Text>

      <Text style={styles.description}>
        We couldn't complete your payment.
        Your cart items are still saved.
        Please try again.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/payment")}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(tabs)/cart")}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Return to Cart</Text>
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
    color: "#DC2626",
    fontWeight: "bold",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 20,
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
  secondaryButton: {
    padding: 16,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
