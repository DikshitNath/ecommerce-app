
import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PaymentProcessingScreen() {
    const router = useRouter();

    const { result, paymentMethod } =
        useLocalSearchParams<{
            result?: string;
            paymentMethod?: string;
        }>();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (result === "failure") {
                router.replace("/payment-failure");
            } else if (result === "success") {
                router.replace({
                    pathname: "/payment-success",
                    params: { paymentMethod },
                });
            } else {
                router.replace("/payment-failure");
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [result, paymentMethod, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#2563EB" />

            <Text style={styles.heading}>Processing Payment</Text>

            <Text style={styles.description}>
                Please wait while we process your payment.
                Do not close the application.
            </Text>
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
    heading: {
        fontSize: 22,
        fontWeight: "700",
        marginTop: 24,
        color: "#0F172A",
    },
    description: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        marginTop: 12,
        lineHeight: 22,
    },
});
