
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";

import ProductCard from "../../components/ProductCard";
import { useCartStore } from "../../stores/cart-store";
import { useProducts } from "../../hooks/use-products";

function HomeHeader() {
  const totalItems = useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  const router = useRouter();

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.logo}>ShopEase</Text>

        <Pressable
          onPress={() => router.push("/cart")}
          accessibilityRole="button"
          accessibilityLabel="Open shopping cart"
        >
          <Text style={{ fontSize: 24 }}>🛒 {totalItems}</Text>
        </Pressable>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.heading}>Discover Products</Text>
        <Text style={styles.subtitle}>
          Find everything you need.
        </Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Summer Sale!</Text>
        <Text style={styles.bannerText}>
          Get up to 50% off
        </Text>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Shop Now</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>

      <View style={styles.categories}>
        {["Fashion", "Electronics", "Shoes", "Watches"].map(
          (category) => (
            <Pressable key={category} style={styles.category}>
              <Text>{category}</Text>
            </Pressable>
          )
        )}
      </View>

      <Text style={styles.sectionTitle}>
        Popular Products
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { data: products, isLoading, isError, refetch } =
    useProducts();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Unable to load products.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={products ?? []}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={<HomeHeader />}
      ListEmptyComponent={
        <Text style={styles.statusText}>
          No products available.
        </Text>
      }
      renderItem={({ item }) => (
        <ProductCard
          id={item._id}
          name={item.name}
          price={item.price}
          description={item.description}
        />
      )}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  welcome: {
    marginTop: 35,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "gray",
    marginTop: 5,
  },
  banner: {
    backgroundColor: "#2563EB",
    padding: 25,
    borderRadius: 15,
    marginTop: 25,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  bannerText: {
    color: "white",
    marginTop: 8,
  },
  button: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 15,
  },
  buttonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 15,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  category: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  statusText: {
    marginTop: 12,
    color: "gray",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
});
