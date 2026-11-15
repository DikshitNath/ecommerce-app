import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminOrders } from "@/hooks/use-orders";
import type { Order, OrderStatus, PaymentStatus } from "@/services/order.service";

type FilterStatus = "ALL" | "PENDING" | "CONFIRMED" | "FAILED";

export default function AdminOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 10;

  // Debounce search query input to avoid unnecessary API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1); // Reset pagination on search change
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAdminOrders(currentPage, pageSize, activeFilter, debouncedSearch);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalOrders = pagination?.totalOrders ?? 0;

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
        return styles.badgeConfirmed;
      case "CANCELLED":
        return styles.badgeCancelled;
      default:
        return styles.badgePending;
    }
  };

  const getPaymentStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case "SUCCESS":
        return styles.paymentSuccess;
      case "FAILED":
        return styles.paymentFailed;
      default:
        return styles.paymentPending;
    }
  };

  const getCustomerName = (order: Order): string => {
    if (typeof order.userId === "object" && order.userId?.name) {
      return order.userId.name;
    }
    if (order.shippingAddress?.fullName) {
      return order.shippingAddress.fullName;
    }
    return "Customer";
  };

  const getCustomerEmail = (order: Order): string => {
    if (typeof order.userId === "object" && order.userId?.email) {
      return order.userId.email;
    }
    return "Email not provided";
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const customerName = getCustomerName(item);
    const customerEmail = getCustomerEmail(item);
    const totalItems = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <Pressable
        style={styles.orderCard}
        onPress={() =>
          router.push({
            pathname: "/admin-order-details",
            params: { orderId: item._id },
          })
        }
      >
        {/* Card Header: Order Number and Date */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, getOrderStatusStyle(item.orderStatus)]}>
              <Text style={styles.badgeText}>{item.orderStatus}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.customerSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerEmail}>{customerEmail}</Text>
          </View>
        </View>

        {/* Order Details Snippet */}
        <View style={styles.itemsSnippet}>
          <Text style={styles.itemsCountText}>
            {totalItems} {totalItems === 1 ? "item" : "items"} • {item.paymentMethod}
          </Text>
        </View>

        {/* Card Footer: Status and Total */}
        <View style={styles.cardFooter}>
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentLabel}>Payment:</Text>
            <View style={[styles.paymentBadge, getPaymentStatusStyle(item.paymentStatus)]}>
              <Text style={styles.paymentBadgeText}>{item.paymentStatus}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 14) + 6 },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Customer Orders</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID, name or email..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={handleClearSearch}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={styles.clearSearchButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        {(["ALL", "PENDING", "CONFIRMED", "FAILED"] as FilterStatus[]).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {filter === "ALL" ? "All Orders" : filter.charAt(0) + filter.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.stateText}>Loading customer orders...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Unable to load orders</Text>
          <Text style={styles.stateText}>
            {error instanceof Error ? error.message : "Please check your network."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={async () => {
                await refetch();
              }}
              colors={["#2563EB"]}
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                Showing {orders.length} of {totalOrders} orders
              </Text>
              <View style={styles.activeBadgesRow}>
                {debouncedSearch.length > 0 && (
                  <View style={styles.searchBadge}>
                    <Text style={styles.searchBadgeText} numberOfLines={1}>
                      &ldquo;{debouncedSearch}&rdquo;
                    </Text>
                    <TouchableOpacity
                      onPress={handleClearSearch}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.searchBadgeClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {activeFilter !== "ALL" && (
                  <Text style={styles.filterBadge}>
                    {activeFilter}
                  </Text>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {debouncedSearch ? "🔍" : "📦"}
              </Text>
              <Text style={styles.emptyTitle}>
                {debouncedSearch ? "No matching orders" : "No orders found"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {debouncedSearch
                  ? `No orders match "${debouncedSearch}"${
                      activeFilter !== "ALL"
                        ? ` in ${activeFilter.toLowerCase()} status`
                        : ""
                    }. Try a different search term or clear filters.`
                  : activeFilter === "ALL"
                  ? "Customers haven't placed any orders yet."
                  : `There are currently no ${activeFilter.toLowerCase()} orders.`}
              </Text>
              {debouncedSearch ? (
                <TouchableOpacity
                  style={styles.clearSearchActionBtn}
                  onPress={handleClearSearch}
                >
                  <Text style={styles.clearSearchActionBtnText}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage <= 1 && styles.pageButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage <= 1 && styles.pageButtonTextDisabled,
                    ]}
                  >
                    ← Previous
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  Page {currentPage} of {totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage >= totalPages && styles.pageButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      currentPage >= totalPages && styles.pageButtonTextDisabled,
                    ]}
                  >
                    Next →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "column",
  },
  backButton: {
    marginBottom: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  refreshButtonText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    height: "100%",
  },
  clearSearchButton: {
    padding: 6,
    marginLeft: 4,
  },
  clearSearchButtonText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  filtersWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  activeBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
    gap: 4,
  },
  searchBadgeText: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "600",
  },
  searchBadgeClose: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "bold",
  },
  filterBadge: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    fontFamily: "monospace",
  },
  orderDate: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeConfirmed: {
    backgroundColor: "#DCFCE7",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeCancelled: {
    backgroundColor: "#FEE2E2",
  },
  customerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  customerEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  itemsSnippet: {
    paddingVertical: 10,
  },
  itemsCountText: {
    fontSize: 13,
    color: "#475569",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  paymentSuccess: {
    backgroundColor: "#DCFCE7",
  },
  paymentPending: {
    backgroundColor: "#FEF3C7",
  },
  paymentFailed: {
    backgroundColor: "#FEE2E2",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stateText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 280,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  pageButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  pageButtonTextDisabled: {
    color: "#94A3B8",
  },
  pageIndicator: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  clearSearchActionBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  clearSearchActionBtnText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
});
