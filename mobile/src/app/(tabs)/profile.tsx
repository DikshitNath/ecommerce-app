
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function ProfileScreen() {
    const user = useAuthStore((state) => state.user);
    const status = useAuthStore((state) => state.status);
    const initialize = useAuthStore((state) => state.initialize);
    const logout = useAuthStore((state) => state.logout);

    const queryClient = useQueryClient();
    const [isRetrying, setIsRetrying] = useState(false);

    const isOffline = status === "offline" || status === "error";

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
        <View style={styles.container}>
            <Text style={styles.title}>My Profile</Text>

            {isOffline && (
                <View style={styles.offlineCard}>
                    <View style={styles.offlineHeader}>
                        <View style={styles.offlineDot} />
                        <Text style={styles.offlineTitle}>
                            Offline Mode
                        </Text>
                    </View>

                    <Text style={styles.offlineMessage}>
                        Your profile is saved on this device, but we
                        couldn't verify your session with the server.
                        Some features may be unavailable.
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
                            <Text style={styles.retryText}>
                                Retry Connection
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                </View>

                <Text style={styles.name}>
                    {user?.name || "User"}
                </Text>

                <Text style={styles.email}>
                    {user?.email || "No email available"}
                </Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>
                    Account Information
                </Text>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Full Name</Text>
                    <Text style={styles.value}>
                        {user?.name || "Not available"}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>
                        {user?.email || "Not available"}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 25,
    },
    offlineCard: {
        backgroundColor: "#FFF7ED",
        borderColor: "#FED7AA",
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },
    offlineHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    offlineDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: "#EA580C",
        marginRight: 8,
    },
    offlineTitle: {
        color: "#9A3412",
        fontSize: 16,
        fontWeight: "700",
    },
    offlineMessage: {
        color: "#9A3412",
        fontSize: 13,
        lineHeight: 19,
    },
    retryButton: {
        backgroundColor: "#EA580C",
        padding: 12,
        borderRadius: 9,
        alignItems: "center",
        marginTop: 14,
        minHeight: 42,
        justifyContent: "center",
    },
    disabledButton: {
        opacity: 0.6,
    },
    retryText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 24,
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 75,
        height: 75,
        borderRadius: 40,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "700",
    },
    name: {
        fontSize: 21,
        fontWeight: "700",
        color: "#111827",
    },
    email: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 5,
    },
    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 18,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 15,
    },
    infoRow: {
        marginBottom: 15,
    },
    label: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 4,
    },
    value: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "500",
    },
    logoutButton: {
        backgroundColor: "#FEE2E2",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 25,
    },
    logoutText: {
        color: "#DC2626",
        fontWeight: "700",
        fontSize: 16,
    },
});
