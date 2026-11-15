import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "../../services/product.service";
import ProductCard from "../../components/ProductCard";
import { useProducts } from "../../hooks/use-products";

const categories = ["All", "Electronics", "Fashion"];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useProducts({
    search: activeSearch,
    category:
      selectedCategory === "All" ? undefined : selectedCategory,
  });

  const clearFilters = () => {
    setSearchText("");
    setActiveSearch("");
    setSelectedCategory("All");
  };

  return (
    <FlatList<Product>
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14) + 6,
          paddingBottom: 80 + insets.bottom,
        },
      ]}
      data={products ?? []}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>Explore Products</Text>
          <Text style={styles.subtitle}>
            Find products that match your needs.
          </Text>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by title or keyword..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => setActiveSearch(searchText.trim())}
              returnKeyType="search"
            />

            <Pressable
              style={({ pressed }) => [
                styles.searchButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setActiveSearch(searchText.trim())}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          {/* Categories Filter */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categories}>
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={({ pressed }) => [
                    styles.category,
                    isActive && styles.activeCategory,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.activeCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>
              {activeSearch || selectedCategory !== "All"
                ? "Filtered Results"
                : "All Products"}
            </Text>

            {(activeSearch.length > 0 || selectedCategory !== "All") && (
              <Pressable onPress={clearFilters}>
                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            )}
          </View>
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
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.statusText}>
              Try adjusting your search terms or category filter.
            </Text>
            {(activeSearch.length > 0 || selectedCategory !== "All") && (
              <Pressable
                style={styles.resetButton}
                onPress={clearFilters}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </Pressable>
            )}
          </View>
        ) : null
      }
      ListFooterComponent={
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.statusText}>Searching products...</Text>
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Unable to load products.</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 20,
  },
  headerBlock: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 14,
    color: "#0F172A",
  },
  searchButton: {
    backgroundColor: "#2563EB",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 22,
    marginBottom: 10,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  category: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeCategory: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  activeCategoryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
    marginTop: 12,
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusText: {
    color: "#64748B",
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resetButton: {
    marginTop: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
