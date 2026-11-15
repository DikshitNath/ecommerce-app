import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "@/hooks/use-products";
import type { Product } from "@/services/product.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "@/services/product.service";

export default function AdminScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["products"],
            });

            Alert.alert("Success", "Product removed successfully.");
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                "Unable to delete product. Please try again.";

            Alert.alert("Delete failed", message);
        },
    });

    const handleDeleteProduct = (product: Product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to remove "${product.name}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(product._id),
                },
            ]
        );
    };

    const {
        data: products = [],
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useProducts();

    const totalStock = products.reduce(
        (total, product) => total + product.stock,
        0
    );

    const lowStockCount = products.filter(
        (product) => product.stock > 0 && product.stock <= 5
    ).length;

    const outOfStockCount = products.filter(
        (product) => product.stock === 0
    ).length;

    const renderProduct = ({ item }: { item: Product }) => {
        const stockStatus =
            item.stock === 0
                ? "Out of stock"
                : item.stock <= 5
                    ? "Low stock"
                    : "In stock";

        const stockColor =
            item.stock === 0
                ? "#DC2626"
                : item.stock <= 5
                    ? "#D97706"
                    : "#059669";

        return (
            <View style={styles.productCard}>
                <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.category}>{item.category}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                            ₹{item.price.toLocaleString("en-IN")}
                        </Text>
                    </View>
                </View>

                <View style={styles.productDetails}>
                    <Text style={styles.detailLabel}>SKU: {item.sku}</Text>

                    <View style={styles.stockRow}>
                        <Text style={styles.detailLabel}>
                            Stock: {item.stock} units
                        </Text>

                        <Text style={[styles.stockStatus, { color: stockColor }]}>
                            {stockStatus}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() =>
                            router.push({
                                pathname: "/admin-edit-product",
                                params: { id: item._id },
                            })
                        }
                    >
                        <Text style={styles.editButtonText}>Edit Product</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProduct(item)}
                        disabled={deleteMutation.isPending}
                    >
                        <Text style={styles.deleteButtonText}>
                            {deleteMutation.isPending ? "Processing..." : "Delete Product"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View
            style={[
                styles.container,
                { paddingTop: Math.max(insets.top, 14) + 6 },
            ]}
        >
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Admin Dashboard</Text>
                    <Text style={styles.subtitle}>Manage your ShopEase store</Text>
                </View>

                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.ordersHeaderButton}
                        onPress={() => router.push("/admin-orders")}
                    >
                        <Text style={styles.ordersHeaderButtonText}>📦 Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.topActionsBar}>
                <TouchableOpacity
                    style={styles.addProductButton}
                    onPress={() => router.push("/admin-add-product")}
                >
                    <Text style={styles.addProductButtonText}>+ Add Product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.manageOrdersBannerButton}
                    onPress={() => router.push("/admin-orders")}
                >
                    <Text style={styles.manageOrdersBannerButtonText}>View Customer Orders →</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.stateText}>Loading products...</Text>
                </View>
            ) : isError ? (
                <View style={styles.centerState}>
                    <Text style={styles.errorTitle}>Unable to load products</Text>
                    <Text style={styles.stateText}>
                        Please check your connection and try again.
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item._id}
                        renderItem={renderProduct}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
                        ]}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={async () => {
                                    await refetch();
                                }}
                            />
                        }
                        ListHeaderComponent={
                            <View>
                                <Text style={styles.sectionTitle}>Overview</Text>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>
                                            {products.length}
                                        </Text>
                                        <Text style={styles.statLabel}>
                                            Active Products
                                        </Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>
                                            {totalStock}
                                        </Text>
                                        <Text style={styles.statLabel}>
                                            Total Stock
                                        </Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Text style={[styles.statValue, { color: "#D97706" }]}>
                                            {lowStockCount}
                                        </Text>
                                        <Text style={styles.statLabel}>
                                            Low Stock
                                        </Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Text style={[styles.statValue, { color: "#DC2626" }]}>
                                            {outOfStockCount}
                                        </Text>
                                        <Text style={styles.statLabel}>
                                            Out of Stock
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Products</Text>
                                    <Text style={styles.productCount}>
                                        {products.length} items
                                    </Text>
                                </View>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>No products found</Text>
                                <Text style={styles.stateText}>
                                    Your active product list is currently empty.
                                </Text>
                            </View>
                        }
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heading: {
        fontSize: 25,
        fontWeight: "800",
        color: "#111827",
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 13,
        marginTop: 5,
    },
    backButton: {
        backgroundColor: "#E5E7EB",
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 9,
    },
    backButtonText: {
        color: "#111827",
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 35,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        width: "48%",
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        padding: 17,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    statValue: {
        fontSize: 25,
        fontWeight: "800",
        color: "#2563EB",
    },
    statLabel: {
        color: "#6B7280",
        fontSize: 12,
        marginTop: 5,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    productCount: {
        color: "#6B7280",
        fontSize: 12,
        marginBottom: 14,
    },
    productCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 13,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    productHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    productInfo: {
        flex: 1,
        marginRight: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    category: {
        color: "#6B7280",
        fontSize: 12,
        marginTop: 5,
    },
    priceContainer: {
        alignItems: "flex-end",
    },
    price: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    productDetails: {
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        marginTop: 14,
        paddingTop: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    stockRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 9,
    },
    stockStatus: {
        fontSize: 12,
        fontWeight: "700",
    },
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 25,
    },
    stateText: {
        color: "#6B7280",
        fontSize: 13,
        textAlign: "center",
        marginTop: 9,
    },
    errorTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#DC2626",
    },
    retryButton: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 9,
        marginTop: 18,
    },
    retryText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    emptyState: {
        paddingVertical: 35,
        alignItems: "center",
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },

    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    ordersHeaderButton: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 9,
    },
    ordersHeaderButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    topActionsBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    manageOrdersBannerButton: {
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 9,
        marginTop: 12,
    },
    manageOrdersBannerButtonText: {
        color: "#2563EB",
        fontWeight: "700",
        fontSize: 13,
    },
    addProductButton: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 9,
        marginTop: 12,
        alignSelf: "flex-start",
    },
    addProductButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 15,
    },
    deleteButton: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "700",
    },
    editButton: {
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 10,
    },
    editButtonText: {
        color: "#1D4ED8",
        fontSize: 12,
        fontWeight: "700",
    },
});
