
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useOrderStore } from "../../stores/order-store";

export default function OrdersScreen() {
  const router = useRouter();

  const orders = useOrderStore((state) => state.orders);

  const renderOrder = ({ item }: { item: (typeof orders)[number] }) => {
    const date = new Date(item.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <Pressable
        style={styles.orderCard}
        onPress={() =>
          router.push({
            pathname: "/order-details",
            params: { orderId: item.id },
          })
        }
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>

          <Text
            style={[
              styles.status,
              item.status === "Delivered" && styles.delivered,
              item.status === "Cancelled" && styles.cancelled,
            ]}
          >
            {item.status}
          </Text>
        </View>

        <View style={styles.divider} />

        {item.items.map((product) => (
          <View key={product.id} style={styles.productRow}>
            <Text style={styles.productName}>
              {product.name} × {product.quantity}
            </Text>

            <Text style={styles.productPrice}>
              ₹{(product.price * product.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <Text style={styles.paymentMethod}>
            Paid via {item.paymentMethod}
          </Text>

          <Text style={styles.total}>
            ₹{item.total.toFixed(2)}
          </Text>
        </View>

        <Text style={styles.detailsLink}>View Details →</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyDescription}>
              Your completed purchases will appear here.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  date: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  delivered: {
    color: "#15803D",
    backgroundColor: "#DCFCE7",
  },
  cancelled: {
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    marginRight: 10,
  },
  productPrice: {
    fontSize: 13,
    color: "#0F172A",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#64748B",
  },
  total: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },
  detailsLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 12,
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 55,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  shopButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
