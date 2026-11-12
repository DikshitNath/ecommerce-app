
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

import {
  registerUser as registerApi,
  loginUser as loginApi,
  getCurrentUser,
  AuthUser,
  RegisterInput,
  LoginInput,
} from "../services/auth.service";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "offline"
  | "unauthenticated"
  | "error";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  register: (payload: RegisterInput) => Promise<void>;
  login: (payload: LoginInput) => Promise<void>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  markBackendOffline: () => void;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong."
    );
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
};

const saveUser = async (user: AuthUser) => {
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(user)
  );
};

const getSavedUser = async (): Promise<AuthUser | null> => {
  try {
    const savedUser = await SecureStore.getItemAsync(USER_KEY);

    if (!savedUser) return null;

    return JSON.parse(savedUser) as AuthUser;
  } catch {
    return null;
  }
};

const clearSession = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",
  error: null,

  register: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const result = await registerApi(payload);

      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await saveUser(result.user);

      set({
        user: result.user,
        status: "authenticated",
        error: null,
      });
    } catch (error) {
      set({
        status: "unauthenticated",
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  login: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const result = await loginApi(payload);

      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await saveUser(result.user);

      set({
        user: result.user,
        status: "authenticated",
        error: null,
      });
    } catch (error) {
      set({
        status: "unauthenticated",
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  initialize: async () => {
    const currentStatus = get().status;

    // Keep the existing screen mounted during background verification.
    if (currentStatus !== "offline" && currentStatus !== "error") {
      set({ status: "loading", error: null });
    }

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!token) {
        await SecureStore.deleteItemAsync(USER_KEY);

        set({
          user: null,
          status: "unauthenticated",
          error: null,
        });
        return;
      }

      // Verify the saved token with the backend.
      const user = await getCurrentUser();

      // Refresh the cached profile after successful verification.
      await saveUser(user);

      set({
        user,
        status: "authenticated",
        error: null,
      });
    } catch (error) {
      const statusCode = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      // A rejected or invalid session must be cleared.
      if (statusCode === 401 || statusCode === 404) {
        await clearSession();

        set({
          user: null,
          status: "unauthenticated",
          error: null,
        });
        return;
      }

      // Network/server failure: restore the cached profile if available.
      const cachedUser = await getSavedUser();

      if (cachedUser) {
        set({
          user: cachedUser,
          status: "offline",
          error: "Unable to verify your session. Some features may be unavailable until you reconnect.",
        });
        return;
      }

      set({
        user: null,
        status: "error",
        error: getErrorMessage(error),
      });
    }
  },

  markBackendOffline: () => {
    const currentState = get();

    // Only switch an existing authenticated session to offline.
    if (currentState.status === "authenticated" && currentState.user) {
      set({
        status: "offline",
        error: "Backend server is currently unavailable.",
      });
    }
  },

  logout: async () => {
    try {
      await clearSession();
    } finally {
      set({
        user: null,
        status: "unauthenticated",
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
