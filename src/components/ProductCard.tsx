
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { useState } from "react";

type ProductCardProps = {
  name: string;
  price: number;
  description: string;
};

type QuantityProps = {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
};

function PlusMinusItems({
  quantity,
  setQuantity,
}: QuantityProps) {
  return (
    <View style={styles.quantityContainer}>
      <Pressable
        onPress={() =>
          setQuantity(prev => Math.max(0, prev - 1))
        }
        style={styles.quantityButton}
        accessibilityLabel="Decrease quantity"
      >
        <Text>-</Text>
      </Pressable>

      <Text style={styles.quantity}>{quantity}</Text>

      <Pressable
        onPress={() =>
          setQuantity(prev => prev + 1)
        }
        style={styles.quantityButton}
        accessibilityLabel="Increase quantity"
      >
        <Text>+</Text>
      </Pressable>
    </View>
  );
}

export default function ProductCard({
  name,
  price,
  description,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);

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
          onPress={() => setQuantity(1)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>
            Add to Cart
          </Text>
        </Pressable>
      ) : (
        <PlusMinusItems
          quantity={quantity}
          setQuantity={setQuantity}
        />
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
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 15,
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
