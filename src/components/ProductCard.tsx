
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { useCartStore } from "../stores/cart-store";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export default function ProductCard({
  id,
  name,
  price,
  description,
}: ProductCardProps) {

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const quantity = useCartStore(
    (state) =>
      state.items.find((item) => item.id === id)?.quantity ?? 0
  );

  const product = {
    id,
    name,
    price,
    description,
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>

      <Text style={styles.price}>
        ₹{price.toLocaleString("en-IN")}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>

      {quantity === 0 ? (
        <Pressable
          style={styles.addButton}
          onPress={() => addToCart(product)}
        >
          <Text style={styles.buttonText}>
            Add to Cart
          </Text>
        </Pressable>
      ) : (
        <View style={styles.quantityContainer}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => decreaseQuantity(id)}
          >
            <Text>-</Text>
          </Pressable>

          <Text style={styles.quantity}>
            {quantity}
          </Text>

          <Pressable
            style={styles.quantityButton}
            onPress={() => increaseQuantity(id)}
          >
            <Text>+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  price: {
    fontSize: 20,
    color: "#2563EB",
    marginTop: 10,
  },
  description: {
    color: "gray",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 15,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
  },
  quantity: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
