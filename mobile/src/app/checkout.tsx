
import { useMemo, useEffect, useState } from "react";

import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCartStore } from "../store/cart-store";

const DELIVERY_FEE = 40;
const ADDRESS_KEY = "shipping_address";

type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);

  const [address, setAddress] =
    useState<ShippingAddress>(EMPTY_ADDRESS);

  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore the previously saved delivery address.
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const savedAddress =
          await SecureStore.getItemAsync(ADDRESS_KEY);

        if (savedAddress) {
          const parsed = JSON.parse(savedAddress);

          setAddress({
            ...EMPTY_ADDRESS,
            ...parsed,
          });
        }
      } catch {
        console.warn("Unable to load saved delivery address.");
      } finally {
        setIsAddressLoading(false);
      }
    };

    loadAddress();
  }, []);

  const updateAddress = (
    field: keyof ShippingAddress,
    value: string
  ) => {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const totalItems = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [items]
  );

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const validateAddress = (): boolean => {
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.postalCode.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all delivery address fields."
      );
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian mobile number."
      );
      return false;
    }

    if (!/^\d{6}$/.test(address.postalCode.trim())) {
      Alert.alert(
        "Invalid PIN Code",
        "Please enter a valid 6-digit PIN code."
      );
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (items.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Please add products before checkout."
      );
      return;
    }

    if (!validateAddress()) return;

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const cleanedAddress: ShippingAddress = {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postalCode: address.postalCode.trim(),
      };

      // Save address locally for future checkouts.
      await SecureStore.setItemAsync(
        ADDRESS_KEY,
        JSON.stringify(cleanedAddress)
      );

      router.push({
        pathname: "/payment",
        params: {
          shippingAddress: JSON.stringify(cleanedAddress),
        },
      });
    } catch {
      Alert.alert(
        "Something went wrong",
        "Unable to save your delivery address. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof ShippingAddress,
    placeholder: string,
    options: {
      keyboardType?: "default" | "phone-pad" | "number-pad";
      maxLength?: number;
      autoCapitalize?: "none" | "sentences" | "words";
    } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={styles.input}
        value={address[field]}
        onChangeText={(value) => updateAddress(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={options.keyboardType || "default"}
        maxLength={options.maxLength}
        autoCapitalize={options.autoCapitalize || "sentences"}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }: { item: (typeof items)[number] }) => (
          <View style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {item.name}
              </Text>

              <Text style={styles.quantity}>
                Quantity: {item.quantity}
              </Text>

              {(
                Object.entries(
                  item.selectedVariants ?? {}
                ) as [string, string][]
              ).map(([name, value]) => (
                <Text key={name} style={styles.variant}>
                  {name}: {value}
                </Text>
              ))}

              <Text style={styles.unitPrice}>
                Unit price: ₹{item.price.toLocaleString("en-IN")}
              </Text>
            </View>

            <Text style={styles.productPrice}>
              ₹{(
                item.price * item.quantity
              ).toLocaleString("en-IN")}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Checkout</Text>

            {/* Delivery Address Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>

              {isAddressLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#2563EB"
                />
              ) : (
                <View style={styles.addressCard}>
                  {renderInput(
                    "Full Name",
                    "fullName",
                    "Enter recipient's name"
                  )}

                  {renderInput(
                    "Phone Number",
                    "phone",
                    "10-digit mobile number",
                    {
                      keyboardType: "phone-pad",
                      maxLength: 10,
                    }
                  )}

                  {renderInput(
                    "House / Street Address",
                    "addressLine",
                    "House number, street, area"
                  )}

                  {renderInput(
                    "City",
                    "city",
                    "Enter city"
                  )}

                  {renderInput(
                    "State",
                    "state",
                    "Enter state"
                  )}

                  {renderInput(
                    "PIN Code",
                    "postalCode",
                    "6-digit PIN code",
                    {
                      keyboardType: "number-pad",
                      maxLength: 6,
                    }
                  )}
                </View>
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Order Summary ({totalItems} items)
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Your cart is empty
            </Text>

            <Text style={styles.emptyText}>
              Add some products to continue shopping.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.checkoutButtonText}>
                Start Shopping
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Price Details
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Delivery Fee
                </Text>
                <Text style={styles.priceValue}>
                  ₹{deliveryFee}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>
                  Estimated Total
                </Text>
                <Text style={styles.totalValue}>
                  ₹{total.toLocaleString("en-IN")}
                </Text>
              </View>

              <Text style={styles.note}>
                Final prices and stock availability will be
                verified by the server.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom Checkout Button */}
      {items.length > 0 && (
        <View style={styles.bottomContainer}>
          <View>
            <Text style={styles.bottomLabel}>
              Estimated Total
            </Text>

            <Text style={styles.bottomTotal}>
              ₹{total.toLocaleString("en-IN")}
            </Text>
          </View>

          <Pressable
            style={[
              styles.checkoutButton,
              (isSubmitting || isAddressLoading) &&
              styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={isSubmitting || isAddressLoading}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutButtonText}>
                Continue to Payment
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  quantity: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },
  variant: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  unitPrice: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  shopButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  priceValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  note: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  bottomLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  checkoutButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 155,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
