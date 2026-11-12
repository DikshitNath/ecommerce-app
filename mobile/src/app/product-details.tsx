
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useProduct } from "@/hooks/use-products";
import { useCartStore } from "@/store/cart-store";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: product, isLoading, isError, refetch } = useProduct(id);

    const addToCart = useCartStore((state) => state.addToCart);
    const [selectedVariants, setSelectedVariants] = useState<
        Record<string, string>
    >({});
    const [quantity, setQuantity] = useState(1);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text>Loading product...</Text>
            </View>
        );
    }

    if (isError || !product) {
        return (
            <View style={styles.center}>
                <Text>Unable to load product details.</Text>
                <Pressable onPress={() => refetch()} style={styles.button}>
                    <Text style={styles.buttonText}>Try Again</Text>
                </Pressable>
            </View>
        );
    }

    const isOutOfStock = product.stock <= 0;

    const allVariantsSelected = product.variants.every(
        (variant) => selectedVariants[variant.name]
    );

    const handleAddToCart = () => {
        if (!allVariantsSelected || isOutOfStock) return;

        addToCart(
            {
                id: product._id,
                name: product.name,
                price: product.price,
                description: product.description,
                stock: product.stock,
            },
            quantity,
            selectedVariants
        );

        router.push("/cart");
    };

    return (
        <ScrollView style={styles.screen}>
            <View style={styles.container}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </Pressable>

                {product.images?.length > 0 ? (
                    <Image
                        source={{ uri: product.images[0] }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text>No image available</Text>
                    </View>
                )}

                <Text style={styles.name}>{product.name}</Text>

                <Text style={styles.price}>
                    ₹{product.price.toLocaleString("en-IN")}
                </Text>

                <Text style={styles.description}>
                    {product.description}
                </Text>

                <Text
                    style={[
                        styles.stock,
                        isOutOfStock && styles.outOfStock,
                    ]}
                >
                    {isOutOfStock
                        ? "Out of stock"
                        : `${product.stock} units available`}
                </Text>

                {product.variants.map((variant) => (
                    <View key={variant.name} style={styles.variantSection}>
                        <Text style={styles.variantTitle}>
                            Select {variant.name}
                        </Text>

                        <View style={styles.options}>
                            {variant.options.map((option) => {
                                const selected =
                                    selectedVariants[variant.name] === option;

                                return (
                                    <Pressable
                                        key={option}
                                        onPress={() =>
                                            setSelectedVariants((previous) => ({
                                                ...previous,
                                                [variant.name]: option,
                                            }))
                                        }
                                        style={[
                                            styles.option,
                                            selected && styles.selectedOption,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selected && styles.selectedOptionText,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {!isOutOfStock && (
                    <View style={styles.quantitySection}>
                        <Text style={styles.variantTitle}>Quantity</Text>

                        <View style={styles.quantityControls}>
                            <Pressable
                                style={styles.quantityButton}
                                disabled={quantity <= 1}
                                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                <Text>-</Text>
                            </Pressable>

                            <Text style={styles.quantity}>{quantity}</Text>

                            <Pressable
                                style={styles.quantityButton}
                                disabled={quantity >= product.stock}
                                onPress={() =>
                                    setQuantity((q) =>
                                        Math.min(product.stock, q + 1)
                                    )
                                }
                            >
                                <Text>+</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                <Pressable
                    style={[
                        styles.button,
                        (isOutOfStock || !allVariantsSelected) &&
                        styles.disabledButton,
                    ]}
                    disabled={isOutOfStock || !allVariantsSelected}
                    onPress={handleAddToCart}
                >
                    <Text style={styles.buttonText}>
                        {isOutOfStock
                            ? "Out of Stock"
                            : !allVariantsSelected
                                ? "Select All Variants"
                                : "Add to Cart"}
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    container: {
        padding: 20,
        paddingTop: 50,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
    },
    backButton: {
        fontSize: 16,
        color: "#2563EB",
        marginBottom: 20,
    },
    image: {
        width: "100%",
        height: 260,
        backgroundColor: "white",
        borderRadius: 15,
    },
    imagePlaceholder: {
        height: 260,
        backgroundColor: "#E2E8F0",
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    name: {
        fontSize: 25,
        fontWeight: "bold",
        marginTop: 20,
    },
    price: {
        fontSize: 24,
        color: "#2563EB",
        fontWeight: "bold",
        marginTop: 12,
    },
    description: {
        color: "gray",
        fontSize: 15,
        marginTop: 12,
    },
    stock: {
        color: "#16A34A",
        marginTop: 12,
    },
    outOfStock: {
        color: "#DC2626",
    },
    variantSection: {
        marginTop: 25,
    },
    variantTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 12,
    },
    options: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    option: {
        padding: 12,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
    },
    selectedOption: {
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
    },
    optionText: {
        color: "#334155",
    },
    selectedOptionText: {
        color: "white",
        fontWeight: "bold",
    },
    quantitySection: {
        marginTop: 25,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    quantityButton: {
        padding: 12,
        backgroundColor: "#E2E8F0",
        borderRadius: 8,
    },
    quantity: {
        fontSize: 18,
        fontWeight: "bold",
    },
    button: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 30,
        marginBottom: 30,
    },
    disabledButton: {
        backgroundColor: "#94A3B8",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
