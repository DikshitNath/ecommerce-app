
import { useState } from "react";
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
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  ProductInput,
} from "@/services/product.service";

export default function AdminAddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

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

  const handleSubmit = () => {
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

    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      Alert.alert(
        "Invalid stock",
        "Stock must be a non-negative whole number."
      );
      return;
    }

    const payload: ProductInput = {
      name: trimmedName,
      description: trimmedDescription,
      price: parsedPrice,
      category: trimmedCategory,
      stock: parsedStock,
      sku: trimmedSku.toUpperCase(),
      images: [],
      variants: [],
    };

    mutation.mutate(payload);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
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
            disabled={mutation.isPending}
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

          <Text style={styles.note}>
            Images and product variants can be configured in a later
            product management update.
          </Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              mutation.isPending && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
  },
  cancelText: {
    color: "#374151",
    fontWeight: "600",
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
  multilineInput: {
    minHeight: 100,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 18,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
    minHeight: 50,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
