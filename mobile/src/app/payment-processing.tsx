
import { useEffect, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
} from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";
import { useProcessPayment } from "../hooks/use-orders";

export default function PaymentProcessingScreen() {
    const router = useRouter();

    const {
        orderId,
        result,
        paymentMethod,
    } = useLocalSearchParams<{
        orderId?: string;
        result?: string;
        paymentMethod?: string;
    }>();

    const { mutateAsync: processPayment } = useProcessPayment();

    // Prevent duplicate API calls from repeated effect execution.
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) {
            return;
        }

        hasProcessed.current = true;

        let isMounted = true;

        const processPaymentRequest = async () => {
            if (!orderId || (result !== "success" && result !== "failure")) {
                if (isMounted) {
                    router.replace({
                        pathname: "/payment-failure",
                        params: {
                            message: "Invalid payment information. Please try again.",
                        },
                    });
                }
                return;
            }

            try {
                // Call backend payment API.
                const order = await processPayment({
                    orderId,
                    outcome: result === "success" ? "SUCCESS" : "FAILED",
                });

                if (!isMounted) {
                    return;
                }

                // Trust the backend response, not the requested outcome.
                if (
                    order.paymentStatus === "SUCCESS" &&
                    order.orderStatus === "CONFIRMED"
                ) {
                    router.replace({
                        pathname: "/payment-success",
                        params: {
                            orderId: order._id,
                            paymentMethod: order.paymentMethod,
                        },
                    });

                    return;
                }

                if (order.paymentStatus === "FAILED") {
                    router.replace({
                        pathname: "/payment-failure",
                        params: {
                            orderId: order._id,
                            paymentMethod: order.paymentMethod,
                            message: "Your payment was declined or unsuccessful.",
                        },
                    });

                    return;
                }

                // An unexpected backend state must never be treated as success.
                router.replace({
                    pathname: "/payment-failure",
                    params: {
                        orderId: order._id,
                        paymentMethod: order.paymentMethod,
                        message: "Payment could not be confirmed. Please check your order.",
                    },
                });
            } catch (error) {
                console.error("Payment processing error:", error);

                if (isMounted) {
                    router.replace({
                        pathname: "/payment-failure",
                        params: {
                            orderId,
                            paymentMethod: paymentMethod ?? "",
                            message:
                                "We couldn't confirm the payment because of a network or server error. Please check your order before retrying.",
                        },
                    });
                }
            }
        };

        processPaymentRequest();

        return () => {
            isMounted = false;
        };
    }, [
        orderId,
        result,
        paymentMethod,
        processPayment,
        router,
    ]);

    return (
        <View style={styles.container}>
            <ActivityIndicator
                size="large"
                color="#2563EB"
            />

            <Text style={styles.heading}>
                Processing Payment
            </Text>

            <Text style={styles.description}>
                Please wait while we communicate with the payment
                server and confirm your order.
                {"\n\n"}
                Do not close the application.
            </Text>

            <Text style={styles.orderId}>
                Order ID: {orderId ?? "Unavailable"}
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

    orderId: {
        fontSize: 11,
        color: "#94A3B8",
        marginTop: 24,
        textAlign: "center",
    },
});
