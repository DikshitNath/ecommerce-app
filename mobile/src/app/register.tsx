
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/auth.store";

export default function RegisterScreen() {
    const router = useRouter();

    const register = useAuthStore((state) => state.register);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleRegister = async () => {
        setError("");

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (normalizedName.length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            console.log("[REGISTER] Sending registration request");

            setLoading(true);

            await register({
                name: normalizedName,
                email: normalizedEmail,
                password,
            });

            console.log("[REGISTER] API successful");
            console.log(
                "[REGISTER] Auth status:",
                useAuthStore.getState().status
            );

            router.replace("/(tabs)");
        } catch (err) {
            console.log("[REGISTER] Registration failed:", err);

            const message =
                useAuthStore.getState().error ||
                "Registration failed. Please try again.";

            setError(message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>ShopEase</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Sign up to start shopping with us.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Full Name</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        editable={!loading}
                    />

                    <Text style={styles.label}>Email Address</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        editable={!loading}
                    />

                    <Text style={styles.label}>Password</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="new-password"
                        editable={!loading}
                    />

                    <Text style={styles.label}>Confirm Password</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#888"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    {!!error && (
                        <Text style={styles.error}>{error}</Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.registerButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.registerButtonText}>
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Already have an account?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace("/login")}
                            disabled={loading}
                        >
                            <Text style={styles.loginLink}> Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    header: {
        marginBottom: 30,
    },
    logo: {
        fontSize: 30,
        fontWeight: "800",
        color: "#2563EB",
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        marginTop: 8,
    },
    form: {
        width: "100%",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#FFFFFF",
    },
    error: {
        color: "#DC2626",
        fontSize: 13,
        marginTop: 14,
    },
    registerButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 28,
    },
    disabledButton: {
        opacity: 0.65,
    },
    registerButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
    },
    footerText: {
        fontSize: 14,
        color: "#6B7280",
    },
    loginLink: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "700",
    },
});
