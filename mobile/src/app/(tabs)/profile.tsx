import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const isOffline = status === "offline" || status === "error";

  const isVerifiedAdmin =
    status === "authenticated" && user?.role === "admin";

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);

    try {
      await initialize();

      const currentStatus = useAuthStore.getState().status;

      if (currentStatus === "authenticated") {
        Alert.alert(
          "Connected",
          "Your session has been verified successfully."
        );
      } else if (currentStatus === "unauthenticated") {
        Alert.alert(
          "Session expired",
          "Please log in again."
        );
      } else {
        Alert.alert(
          "Still offline",
          "Unable to verify your session. Please try again."
        );
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            queryClient.clear();
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14) + 6,
          paddingBottom: 80 + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          Account settings and preferences
        </Text>
      </View>

      {isOffline && (
        <View style={styles.offlineCard}>
          <View style={styles.offlineHeader}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineTitle}>Offline Mode</Text>
          </View>

          <Text style={styles.offlineMessage}>
            Your profile is saved on this device, but we couldn&apos;t
            verify your session with the server. Some features may be
            unavailable.
          </Text>

          <TouchableOpacity
            style={[
              styles.retryButton,
              isRetrying && styles.disabledButton,
            ]}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.retryText}>Retry Connection</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* User profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || "User"}</Text>

        <Text style={styles.email}>
          {user?.email || "No email available"}
        </Text>

        {isVerifiedAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        )}
      </View>

      {isVerifiedAdmin && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin")}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.adminButtonTitle}>
              Admin Dashboard
            </Text>
            <Text style={styles.adminButtonSubtitle}>
              Manage inventory, products, and orders
            </Text>
          </View>

          <Text style={styles.adminArrow}>{"\u2192"}</Text>
        </TouchableOpacity>
      )}

      {/* Account Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>
            {user?.name || "Not available"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>
            {user?.email || "Not available"}
          </Text>
        </View>

        <View style={[styles.infoRow, { marginBottom: 0 }]}>
          <Text style={styles.label}>Role</Text>
          <Text style={[styles.value, { textTransform: "capitalize" }]}>
            {user?.role || "Customer"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  offlineCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  offlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EA580C",
    marginRight: 8,
  },
  offlineTitle: {
    color: "#9A3412",
    fontSize: 15,
    fontWeight: "700",
  },
  offlineMessage: {
    color: "#9A3412",
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#EA580C",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  email: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  adminBadgeText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  adminButton: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminButtonTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  adminButtonSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },
  adminArrow: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  infoRow: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
  },
});
