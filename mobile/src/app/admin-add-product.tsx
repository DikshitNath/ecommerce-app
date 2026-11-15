import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  ProductInput,
} from "@/services/product.service";
import {
  pickImagesFromGallery,
  uploadProductImages,
  SelectedImage,
} from "@/services/image-upload.service";

export default function AdminAddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      Alert.alert("Success", "Product added successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to create product. Please try again.";

      Alert.alert("Creation failed", message);
    },
  });

  const handlePickImages = async () => {
    const result = await pickImagesFromGallery();
    if (result.error) {
      Alert.alert("Image Selection", result.error);
      return;
    }
    if (!result.canceled && result.images.length > 0) {
      setSelectedImages((prev) => {
        const combined = [...prev, ...result.images];
        if (combined.length > 10) {
          Alert.alert("Limit Reached", "You can select up to 10 images maximum.");
          return combined.slice(0, 10);
        }
        return combined;
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const trimmedSku = sku.trim();

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !trimmedName ||
      !trimmedDescription ||
      !trimmedCategory ||
      !trimmedSku ||
      !price.trim() ||
      !stock.trim()
    ) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Invalid price", "Enter a valid non-negative price.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      Alert.alert(
        "Invalid stock",
        "Stock must be a non-negative whole number."
      );
      return;
    }

    setIsUploading(true);
    let uploadedUrls: string[] = [];

    try {
      if (selectedImages.length > 0) {
        uploadedUrls = await uploadProductImages(selectedImages);
      }
    } catch (err: any) {
      setIsUploading(false);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Image upload failed. Please try again.";
      Alert.alert(
        "Image Upload Failed",
        `${errorMsg}\n\nYour product information was preserved.`
      );
      return;
    }

    setIsUploading(false);

    const payload: ProductInput = {
      name: trimmedName,
      description: trimmedDescription,
      price: parsedPrice,
      category: trimmedCategory,
      stock: parsedStock,
      sku: trimmedSku.toUpperCase(),
      images: uploadedUrls,
      variants: [],
    };

    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending || isUploading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 14) + 6,
            paddingBottom: Math.max(insets.bottom, 20) + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Add Product</Text>
            <Text style={styles.subtitle}>
              Enter the details of your new product
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Describe your product"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Electronics, Clothing"
            value={category}
            onChangeText={setCategory}
            maxLength={60}
          />

          <Text style={styles.label}>Available Stock *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter stock quantity"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. HEADPHONE-001"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
            maxLength={50}
          />

          {/* Product Image Upload Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageHeaderRow}>
              <Text style={styles.label}>Product Images</Text>
              <Text style={styles.imageCountText}>
                {selectedImages.length}/10 selected
              </Text>
            </View>

            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={handlePickImages}
              disabled={isSubmitting || selectedImages.length >= 10}
            >
              <Text style={styles.pickImageButtonText}>
                📷 Select Images from Device Gallery
              </Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewsContainer}
              >
                {selectedImages.map((img, index) => (
                  <View key={img.uri || index} style={styles.previewWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageBadge}
                      onPress={() => handleRemoveImage(index)}
                      accessibilityLabel="Remove image"
                    >
                      <Text style={styles.removeImageBadgeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.submitText}>
                  {isUploading ? "Uploading Images..." : "Adding Product..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Add Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  cancelText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  multilineInput: {
    minHeight: 90,
  },
  imageSection: {
    marginTop: 4,
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  imageCountText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  pickImageButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickImageButtonText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 14,
  },
  previewsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
  },
  previewWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "visible",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  removeImageBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  removeImageBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    lineHeight: 12,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#93C5FD",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
