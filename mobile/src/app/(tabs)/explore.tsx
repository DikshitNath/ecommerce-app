
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

import ProductCard from "../../components/ProductCard";
import { useProducts } from "../../hooks/use-products";

const categories = ["All", "Electronics", "Fashion"];

export default function ExploreScreen() {
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
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.container}
      data={products ?? []}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Explore Products</Text>
          <Text style={styles.subtitle}>
            Find products that match your needs.
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => setActiveSearch(searchText.trim())}
              returnKeyType="search"
            />

            <Pressable
              style={styles.searchButton}
              onPress={() => setActiveSearch(searchText.trim())}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Categories</Text>

          <View style={styles.categories}>
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.category,
                    isActive && styles.activeCategory,
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

          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Products</Text>

            <Pressable onPress={clearFilters}>
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <ProductCard
          id={item._id}
          name={item.name}
          price={item.price}
          description={item.description}
        />
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.statusText}>Loading products...</Text>
            </>
          ) : isError ? (
            <>
              <Text style={styles.errorText}>
                Unable to load products.
              </Text>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.statusText}>
              No matching products found.
            </Text>
          )}
        </View>
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
    padding: 20,
    paddingTop: 50,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "gray",
    marginTop: 6,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchButton: {
    backgroundColor: "#2563EB",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  category: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeCategory: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    color: "#334155",
  },
  activeCategoryText: {
    color: "white",
    fontWeight: "bold",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  statusText: {
    color: "gray",
    marginTop: 12,
  },
  errorText: {
    color: "red",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
});
