import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProduct } from "@/hooks/use-products";
import { useCartStore } from "@/store/cart-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import ProductImage from "@/components/ProductImage";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: product, isLoading, isError, refetch } = useProduct(id);

  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: Math.max(insets.top, 20) + 40 },
        ]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.helperText}>Loading product...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: Math.max(insets.top, 20) + 40 },
        ]}
      >
        <Text style={styles.errorText}>Unable to load product details.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
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
        images: product.images,
      },
      quantity,
      selectedVariants
    );

    router.push("/cart");
  };

  const currentImageUri =
    product.images && product.images.length > 0
      ? product.images[Math.min(selectedImageIndex, product.images.length - 1)]
      : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={product.name}
        subtitle={product.category}
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageCard}>
          <ProductImage
            uri={currentImageUri}
            style={styles.image}
            resizeMode="contain"
            fallbackText="No Product Images"
          />
        </View>

        {product.images && product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailStrip}
          >
            {product.images.map((imgUri, index) => {
              const isSelected = index === selectedImageIndex;
              return (
                <Pressable
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnailContainer,
                    isSelected && styles.selectedThumbnail,
                  ]}
                >
                  <ProductImage
                    uri={imgUri}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.name}>{product.name}</Text>

        <Text style={styles.price}>
          ₹{product.price.toLocaleString("en-IN")}
        </Text>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockBadge,
              isOutOfStock ? styles.outOfStockBadge : styles.inStockBadge,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                isOutOfStock
                  ? styles.outOfStockBadgeText
                  : styles.inStockBadgeText,
              ]}
            >
              {isOutOfStock
                ? "Out of Stock"
                : `${product.stock} in stock`}
            </Text>
          </View>
        </View>

        {product.variants.map((variant) => (
          <View key={variant.name} style={styles.variantSection}>
            <Text style={styles.variantTitle}>{variant.name}</Text>
            <View style={styles.options}>
              {variant.options.map((option) => {
                const isSelected =
                  selectedVariants[variant.name] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [variant.name]: option,
                      }))
                    }
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
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

        <View style={styles.quantitySection}>
          <Text style={styles.variantTitle}>Quantity</Text>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable
              onPress={() =>
                setQuantity((prev) =>
                  Math.min(product.stock, prev + 1)
                )
              }
              style={[
                styles.quantityButton,
                quantity >= product.stock && styles.disabledQuantityButton,
              ]}
              disabled={quantity >= product.stock}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleAddToCart}
          disabled={!allVariantsSelected || isOutOfStock}
          style={[
            styles.button,
            (!allVariantsSelected || isOutOfStock) &&
              styles.disabledButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {isOutOfStock
              ? "Out of Stock"
              : !allVariantsSelected
              ? "Select Options"
              : `Add to Cart (₹${(product.price * quantity).toLocaleString("en-IN")})`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  helperText: {
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
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  thumbnailStrip: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  selectedThumbnail: {
    borderColor: "#2563EB",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 18,
    lineHeight: 28,
  },
  price: {
    fontSize: 24,
    color: "#2563EB",
    fontWeight: "900",
    marginTop: 8,
  },
  description: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  stockRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inStockBadge: {
    backgroundColor: "#DCFCE7",
  },
  outOfStockBadge: {
    backgroundColor: "#FEE2E2",
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inStockBadgeText: {
    color: "#15803D",
  },
  outOfStockBadgeText: {
    color: "#B91C1C",
  },
  variantSection: {
    marginTop: 20,
  },
  variantTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  optionText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  quantitySection: {
    marginTop: 22,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledQuantityButton: {
    opacity: 0.4,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    minWidth: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
