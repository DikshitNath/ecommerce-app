
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/hooks/use-products";
import { updateProduct, ProductInput } from "@/services/product.service";

export default function AdminEditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useProduct(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(String(product.price));
      setCategory(product.category);
      setStock(String(product.stock));
      setSku(product.sku);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<ProductInput>) =>
      updateProduct(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
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

  const handleUpdate = () => {
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

    const payload: Partial<ProductInput> = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category: category.trim(),
      stock: parsedStock,
      sku: sku.trim().toUpperCase(),
    };

    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.helperText}>Loading product...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.center}>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Edit Product</Text>
        <Text style={styles.subtitle}>
          Update the information for {product.name}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Available Stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[
              styles.button,
              mutation.isPending && styles.disabled,
            ]}
            onPress={handleUpdate}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={mutation.isPending}
          >
            <Text style={styles.cancelText}>Cancel</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 17,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  multiline: {
    minHeight: 100,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 25,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  helperText: {
    color: "#6B7280",
    marginTop: 10,
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "600",
  },
});
