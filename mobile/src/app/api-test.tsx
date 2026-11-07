import { View, Text, ActivityIndicator } from "react-native";
import { useProducts } from "@/hooks/use-products";

export default function ApiTestScreen() {
  const { data, isLoading, isError, error } = useProducts();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Text>Failed to load products.</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Backend Products
      </Text>

      {data?.map((product) => (
        <View key={product._id} style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {product.name}
          </Text>
          <Text>Price: ₹{product.price}</Text>
          <Text>Stock: {product.stock}</Text>
          <Text>Category: {product.category}</Text>
        </View>
      ))}
    </View>
  );
}