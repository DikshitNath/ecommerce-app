import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "../../services/product.service";
import ProductCard from "../../components/ProductCard";
import { useProducts } from "../../hooks/use-products";
import { useCartStore } from "../../store/cart-store";
import { TabIcon } from "../../components/TabIcon";
import { Colors } from "../../constants/theme";

function HomeHeader() {
  const insets = useSafeAreaInsets();
  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const router = useRouter();

  return (
    <View style={{ paddingTop: Math.max(insets.top, 14) + 6 }}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>ShopEase</Text>
          <Text style={styles.storeTagline}>Quality shopping made simple</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cartHeaderButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/cart")}
          accessibilityRole="button"
          accessibilityLabel="Open shopping cart"
        >
          <TabIcon
            name="cart"
            color={Colors.light.primary}
            focused={false}
            size={20}
            badgeCount={totalItems}
          />
          <Text style={styles.cartCountText}>{totalItems}</Text>
        </Pressable>
      </View>

      {/* Hero Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>LIMITED OFFER</Text>
        </View>
        <Text style={styles.bannerTitle}>Summer Sale!</Text>
        <Text style={styles.bannerSubtitle}>
          Get up to 50% off selected trending styles
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.bannerButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.bannerButtonText}>Shop Now →</Text>
        </Pressable>
      </View>

      {/* Categories Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable onPress={() => router.push("/explore")}>
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      </View>

      <View style={styles.categories}>
        {["Fashion", "Electronics", "Shoes", "Watches"].map((category) => (
          <Pressable
            key={category}
            style={({ pressed }) => [
              styles.categoryChip,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/explore",
              })
            }
          >
            <Text style={styles.categoryChipText}>{category}</Text>
          </Pressable>
        ))}
      </View>

      {/* Popular Products Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Popular Products</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: products, isLoading, isError, refetch } = useProducts();

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: Math.max(insets.top, 20) + 40 },
        ]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: Math.max(insets.top, 20) + 40 },
        ]}
      >
        <Text style={styles.errorText}>Unable to load products.</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList<Product>
      data={products ?? []}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={<HomeHeader />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.statusText}>
            Check back soon for new arrivals.
          </Text>
        </View>
      }
      renderItem={({ item }: { item: Product }) => (
        <ProductCard
          id={item._id}
          name={item.name}
          price={item.price}
          description={item.description}
          stock={item.stock}
          hasVariants={item.variants.length > 0}
          images={item.images}
        />
      )}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: 80 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: -0.5,
  },
  storeTagline: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  cartHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cartCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  banner: {
    backgroundColor: "#2563EB",
    padding: 22,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  bannerButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  bannerButtonText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  seeAllText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  statusText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginTop: 16,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
