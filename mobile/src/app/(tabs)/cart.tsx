
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useRouter } from "expo-router";
import type { CartItem } from "../../store/cart-store";
import { useCartStore } from "../../store/cart-store";

export default function CartScreen() {
    const items = useCartStore((state) => state.items);

    const increaseQuantity = useCartStore(
        (state) => state.increaseQuantity
    );

    const decreaseQuantity = useCartStore(
        (state) => state.decreaseQuantity
    );

    const removeFromCart = useCartStore(
        (state) => state.removeFromCart
    );

    const router = useRouter();

    // Calculate subtotal of all cart entries.
    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    // Calculate total quantity across all products and variants.
    const totalItems = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <FlatList<CartItem>
            data={items}
            keyExtractor={(item) => item.cartItemId}
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

                    <Pressable
                        style={styles.shopButton}
                        onPress={() => router.push("/")}
                    >
                        <Text style={styles.checkoutText}>
                            Continue Shopping
                        </Text>
                    </Pressable>
                </View>
            }
            renderItem={({ item }: { item: CartItem }) => {
                // Calculate quantity across every variant of this product.
                const productTotalQuantity = items
                    .filter((cartItem) => cartItem.id === item.id)
                    .reduce(
                        (total, cartItem) => total + cartItem.quantity,
                        0
                    );

                // Stock belongs to the product, not an individual variant.
                const isLimitReached =
                    productTotalQuantity >= item.stock;

                return (
                    <View style={styles.card}>
                        <Text style={styles.productName}>
                            {item.name}
                        </Text>

                        <Text style={styles.price}>
                            ₹{item.price.toLocaleString("en-IN")}
                        </Text>

                        {/* Display selected product variants */}
                        {Object.entries(item.selectedVariants).map(
                            ([variantName, variantValue]) => (
                                <Text
                                    key={variantName}
                                    style={styles.variant}
                                >
                                    {variantName}: {variantValue}
                                </Text>
                            )
                        )}

                        <Text style={styles.stock}>
                            {item.stock} units available
                        </Text>

                        {/* Quantity controls */}
                        <View style={styles.controls}>
                            <Pressable
                                onPress={() =>
                                    decreaseQuantity(item.cartItemId)
                                }
                                style={styles.quantityButton}
                            >
                                <Text style={styles.quantityButtonText}>
                                    -
                                </Text>
                            </Pressable>

                            <Text style={styles.quantity}>
                                {item.quantity}
                            </Text>

                            <Pressable
                                disabled={isLimitReached}
                                onPress={() =>
                                    increaseQuantity(item.cartItemId)
                                }
                                style={[
                                    styles.quantityButton,
                                    isLimitReached && styles.disabledButton,
                                ]}
                            >
                                <Text style={styles.quantityButtonText}>
                                    +
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() =>
                                    removeFromCart(item.cartItemId)
                                }
                                style={styles.removeButton}
                            >
                                <Text style={styles.removeText}>
                                    Remove
                                </Text>
                            </Pressable>
                        </View>

                        {isLimitReached && (
                            <Text style={styles.limitText}>
                                Maximum available stock reached across all variants.
                            </Text>
                        )}

                        {/* Individual variant total */}
                        <View style={styles.itemTotalRow}>
                            <Text>Item total</Text>

                            <Text style={styles.itemTotal}>
                                ₹{(
                                    item.price * item.quantity
                                ).toLocaleString("en-IN")}
                            </Text>
                        </View>
                    </View>
                );
            }}
            ListFooterComponent={
                items.length > 0 ? (
                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>
                            Order Summary
                        </Text>

                        <View style={styles.summaryRow}>
                            <Text>Total Items</Text>
                            <Text style={styles.total}>
                                {totalItems}
                            </Text>
                        </View>

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
                            onPress={() => router.push("/checkout")}
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

    variant: {
        color: "#475569",
        marginTop: 5,
    },

    stock: {
        color: "#16A34A",
        fontSize: 12,
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
        minWidth: 36,
        alignItems: "center",
    },

    quantityButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    disabledButton: {
        opacity: 0.4,
    },

    quantity: {
        fontWeight: "bold",
        fontSize: 16,
    },

    removeButton: {
        marginLeft: "auto",
    },

    removeText: {
        color: "#DC2626",
        fontWeight: "600",
    },

    limitText: {
        color: "#DC2626",
        fontSize: 12,
        marginTop: 8,
    },

    itemTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        marginTop: 15,
        paddingTop: 12,
    },

    itemTotal: {
        fontWeight: "bold",
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
        marginBottom: 12,
    },

    total: {
        fontWeight: "bold",
        fontSize: 18,
    },

    delivery: {
        color: "gray",
        marginTop: 4,
    },

    checkoutButton: {
        backgroundColor: "#2563EB",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },

    shopButton: {
        backgroundColor: "#2563EB",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },

    checkoutText: {
        color: "white",
        fontWeight: "bold",
    },
});
