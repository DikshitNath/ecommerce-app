import { useCartStore } from "../../stores/cart-store";


import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
} from "react-native";

import { useRouter } from "expo-router";

export default function CartScreen() {
    const items = useCartStore((state) => state.items);

    const router = useRouter();

    const increaseQuantity = useCartStore(
        (state) => state.increaseQuantity
    );

    const decreaseQuantity = useCartStore(
        (state) => state.decreaseQuantity
    );

    const removeFromCart = useCartStore(
        (state) => state.removeFromCart
    );

    const subtotal = items.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            ListHeaderComponent={
                <Text style={styles.heading}>
                    My Shopping Cart
                </Text>
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        Your cart is empty!
                    </Text>

                    <Text style={styles.emptyText}>
                        Add some products to get started.
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.productName}>
                        {item.name}
                    </Text>

                    <Text style={styles.price}>
                        ₹{item.price.toLocaleString("en-IN")}
                    </Text>

                    <View style={styles.controls}>
                        <Pressable
                            onPress={() => decreaseQuantity(item.id)}
                            style={styles.quantityButton}
                        >
                            <Text>-</Text>
                        </Pressable>

                        <Text style={styles.quantity}>
                            {item.quantity}
                        </Text>

                        <Pressable
                            onPress={() => increaseQuantity(item.id)}
                            style={styles.quantityButton}
                        >
                            <Text>+</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => removeFromCart(item.id)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeText}>
                                Remove
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}

            ListFooterComponent={
                items.length > 0 ? (
                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>
                            Order Summary
                        </Text>

                        <View style={styles.summaryRow}>
                            <Text>Subtotal</Text>

                            <Text style={styles.total}>
                                ₹{subtotal.toLocaleString("en-IN")}
                            </Text>
                        </View>

                        <Text style={styles.delivery}>
                            Delivery charges calculated at checkout.
                        </Text>

                        <Pressable
                            onPress={() => {
                                console.log("Checkout button pressed");
                                router.push("/checkout");
                            }}
                            style={styles.checkoutButton}
                        >
                            <Text style={styles.checkoutText}>
                                Proceed to Checkout
                            </Text>
                        </Pressable>
                    </View>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#F8FAFC",
        flexGrow: 1,
    },
    heading: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 25,
    },
    card: {
        backgroundColor: "white",
        padding: 18,
        borderRadius: 12,
        marginBottom: 15,
    },
    productName: {
        fontSize: 18,
        fontWeight: "bold",
    },
    price: {
        color: "#2563EB",
        fontSize: 18,
        marginTop: 8,
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 15,
    },
    quantityButton: {
        backgroundColor: "#E5E7EB",
        padding: 10,
        borderRadius: 6,
    },
    quantity: {
        fontWeight: "bold",
    },
    removeButton: {
        marginLeft: "auto",
    },
    removeText: {
        color: "#DC2626",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    emptyText: {
        color: "gray",
        marginTop: 8,
    },
    summary: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        marginTop: 15,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    total: {
        fontWeight: "bold",
        fontSize: 18,
    },
    delivery: {
        color: "gray",
        marginTop: 12,
    },
    checkoutButton: {
        backgroundColor: "#2563EB",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    checkoutText: {
        color: "white",
        fontWeight: "bold",
    },
});
