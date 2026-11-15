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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/hooks/use-products";
import { updateProduct, ProductInput, Product } from "@/services/product.service";
import {
  pickImagesFromGallery,
  uploadProductImages,
  resolveImageUrl,
  SelectedImage,
} from "@/services/image-upload.service";

export default function AdminEditProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.helperText}>Loading product...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.errorText}>Unable to load this product.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <EditProductForm key={product._id} product={product} id={id} />;
}

function EditProductForm({ product, id }: { product: Product; id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category);
  const [stock, setStock] = useState(String(product.stock));
  const [sku, setSku] = useState(product.sku);

  const [existingImages, setExistingImages] = useState<string[]>(product.images || []);
  const [newImages, setNewImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: Partial<ProductInput>) =>
      updateProduct(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["product", id],
      });

      Alert.alert("Success", "Product updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },

    onError: (error: any) => {
      Alert.alert(
        "Update failed",
        error?.response?.data?.message ||
          "Unable to update product. Please try again."
      );
    },
  });

  const handlePickImages = async () => {
    const totalCurrentImages = existingImages.length + newImages.length;
    if (totalCurrentImages >= 10) {
      Alert.alert("Limit Reached", "You can have up to 10 images maximum per product.");
      return;
    }

    const result = await pickImagesFromGallery();
    if (result.error) {
      Alert.alert("Image Selection", result.error);
      return;
    }

    if (!result.canceled && result.images.length > 0) {
      setNewImages((prev) => {
        const combined = [...prev, ...result.images];
        const allowedNew = 10 - existingImages.length;
        if (combined.length > allowedNew) {
          Alert.alert("Limit Reached", "Total images capped at 10.");
          return combined.slice(0, allowedNew);
        }
        return combined;
      });
    }
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdate = async () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !name.trim() ||
      !description.trim() ||
      !category.trim() ||
      !sku.trim() ||
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
      Alert.alert("Invalid stock", "Enter a valid whole number.");
      return;
    }

    setIsUploading(true);
    let newlyUploadedUrls: string[] = [];

    try {
      if (newImages.length > 0) {
        newlyUploadedUrls = await uploadProductImages(newImages);
      }
    } catch (err: any) {
      setIsUploading(false);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Image upload failed. Please try again.";
      Alert.alert(
        "Image Upload Failed",
        `${errorMsg}\n\nYour modifications were preserved.`
      );
      return;
    }

    setIsUploading(false);

    const finalImages = [...existingImages, ...newlyUploadedUrls];

    const payload: Partial<ProductInput> = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category: category.trim(),
      stock: parsedStock,
      sku: sku.trim().toUpperCase(),
      images: finalImages,
    };

    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending || isUploading;
  const totalImagesCount = existingImages.length + newImages.length;

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
            <Text style={styles.title}>Edit Product</Text>
            <Text style={styles.subtitle}>
              Update the information for {product.name}
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
            value={name}
            onChangeText={setName}
            maxLength={100}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            maxLength={60}
          />

          <Text style={styles.label}>Available Stock *</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={styles.input}
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
            maxLength={50}
          />

          {/* Product Image Management Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageHeaderRow}>
              <Text style={styles.label}>Product Images</Text>
              <Text style={styles.imageCountText}>
                {totalImagesCount}/10 total
              </Text>
            </View>

            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={handlePickImages}
              disabled={isSubmitting || totalImagesCount >= 10}
            >
              <Text style={styles.pickImageButtonText}>
                📷 Add Images from Device Gallery
              </Text>
            </TouchableOpacity>

            {totalImagesCount > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewsContainer}
              >
                {/* Existing Images */}
                {existingImages.map((imgUri, index) => (
                  <View key={`existing-${imgUri}-${index}`} style={styles.previewWrapper}>
                    <Image
                      source={{ uri: resolveImageUrl(imgUri) }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageBadge}
                      onPress={() => handleRemoveExistingImage(index)}
                      accessibilityLabel="Remove existing image"
                    >
                      <Text style={styles.removeImageBadgeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Newly Picked Images */}
                {newImages.map((img, index) => (
                  <View key={`new-${img.uri}-${index}`} style={[styles.previewWrapper, styles.newImageBorder]}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageBadge}
                      onPress={() => handleRemoveNewImage(index)}
                      accessibilityLabel="Remove new image"
                    >
                      <Text style={styles.removeImageBadgeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noImagesNotice}>
                No images attached. Add photos to showcase this product.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.submitText}>
                  {isUploading ? "Uploading Images..." : "Saving Changes..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Save Changes</Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 16,
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
  newImageBorder: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 10,
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
  noImagesNotice: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
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
  button: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
