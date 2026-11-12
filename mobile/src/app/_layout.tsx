
import { useEffect, useRef } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { AnimatedSplashOverlay } from "@/components/animated-icon";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { useAuthStore } from "../store/auth.store";
import { checkBackendHealth } from "../services/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const markBackendOffline = useAuthStore(
    (state) => state.markBackendOffline
  );

  const healthCheckInProgress = useRef(false);

  const isAuthenticated =
    status === "authenticated" || status === "offline";

  // Restore the saved authentication session.
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Hide the native splash screen after initial session initialization.
  useEffect(() => {
    if (status !== "loading") {
      SplashScreen.hideAsync();
    }
  }, [status]);

  // Monitor actual backend availability.
  useEffect(() => {
    if (
      status !== "authenticated" &&
      status !== "offline"
    ) {
      return;
    }

    const checkServer = async () => {
      if (healthCheckInProgress.current) return;

      healthCheckInProgress.current = true;

      try {
        const isBackendAvailable = await checkBackendHealth();

        const currentStatus = useAuthStore.getState().status;

        if (!isBackendAvailable) {
          if (currentStatus === "authenticated") {
            markBackendOffline();
          }

          return;
        }

        // Backend is back. Verify the saved JWT again.
        if (currentStatus === "offline") {
          await initialize();
        }
      } catch (error) {
        console.warn("Backend health monitoring failed:", error);
      } finally {
        healthCheckInProgress.current = false;
      }
    };

    // Check immediately, then every 15 seconds.
    checkServer();

    const interval = setInterval(checkServer, 15000);

    return () => clearInterval(interval);
  }, [status, initialize, markBackendOffline]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <AnimatedSplashOverlay />

        {status !== "loading" && (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product-details" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="payment" />
              <Stack.Screen name="payment-processing" />
              <Stack.Screen name="payment-success" />
              <Stack.Screen name="payment-failure" />
              <Stack.Screen name="order-details" />
              <Stack.Screen name="api-test" />
            </Stack.Protected>
          </Stack>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
