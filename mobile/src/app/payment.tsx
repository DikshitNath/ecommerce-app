
import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../stores/cart-store";

type PaymentMethod = "UPI" | "CARD" | "COD";

const DELIVERY_FEE = 40;

export default function PaymentScreen() {
    const router = useRouter();

    const items = useCartStore((state) => state.items);

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("UPI");

    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const total = subtotal + DELIVERY_FEE;

    const handlePayment = () => {
        if (items.length === 0) {
            Alert.alert("Empty Cart", "Your cart is empty.");
            router.replace("/(tabs)/cart");
            return;
        }

        router.push({
            pathname: "/payment-processing",
            params: {
                result: "success",
                paymentMethod,
            },
        });
    };

    const PaymentOption = ({
        title,
        description,
        value,
    }: {
        title: string;
        description: string;
        value: PaymentMethod;
    }) => {
        const selected = paymentMethod === value;

        return (
            <Pressable
                onPress={() => setPaymentMethod(value)}
                style={[
                    styles.paymentOption,
                    selected && styles.selectedOption,
                ]}
            >
                <View style={styles.optionContent}>
                    <View style={styles.radioOuter}>
                        {selected && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{title}</Text>
                        <Text style={styles.optionDescription}>
                            {description}
                        </Text>
                    </View>
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
                    description="Pay when your order arrives"
                    value="COD"
                />

                <View style={styles.summary}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.label}>Subtotal</Text>
                        <Text style={styles.value}>
                            ₹{subtotal.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.label}>Delivery Fee</Text>
                        <Text style={styles.value}>₹{DELIVERY_FEE}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>
                            ₹{total.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <View>
                    <Text style={styles.bottomLabel}>Amount to Pay</Text>
                    <Text style={styles.bottomTotal}>
                        ₹{total.toFixed(2)}
                    </Text>
                </View>

                <Pressable
                    style={[
                        styles.payButton,
                        items.length === 0 && styles.disabledButton,
                    ]}
                    onPress={handlePayment}
                    disabled={items.length === 0}
                >
                    <Text style={styles.payButtonText}>Pay Now</Text>
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
        paddingHorizontal: 30,
        borderRadius: 12,
    },
    disabledButton: {
        backgroundColor: "#94A3B8",
    },
    payButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});
