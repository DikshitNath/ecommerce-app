
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
  UserRole,
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

// Normalize old cached profiles and protect against malformed data.
const normalizeUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as Record<string, unknown>;

  if (
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string"
  ) {
    return null;
  }

  const role: UserRole =
    user.role === "admin" ? "admin" : "customer";

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    ...(typeof user.createdAt === "string"
      ? { createdAt: user.createdAt }
      : {}),
  };
};

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
  const normalizedUser = normalizeUser(user);

  if (!normalizedUser) {
    throw new Error("Invalid user profile received from server.");
  }

  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(normalizedUser)
  );
};

const getSavedUser = async (): Promise<AuthUser | null> => {
  try {
    const savedUser = await SecureStore.getItemAsync(USER_KEY);

    if (!savedUser) return null;

    return normalizeUser(JSON.parse(savedUser));
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
      const user = normalizeUser(result.user);

      if (!user) {
        throw new Error("Invalid user profile received from server.");
      }

      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await saveUser(user);

      set({
        user,
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
      const user = normalizeUser(result.user);

      if (!user) {
        throw new Error("Invalid user profile received from server.");
      }

      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await saveUser(user);

      set({
        user,
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

    // Keep existing screens mounted during background verification.
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

      // Always refresh the profile and role from the backend.
      const user = normalizeUser(await getCurrentUser());

      if (!user) {
        throw new Error("Invalid user profile received from server.");
      }

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

      if (statusCode === 401 || statusCode === 404) {
        await clearSession();

        set({
          user: null,
          status: "unauthenticated",
          error: null,
        });
        return;
      }

      const cachedUser = await getSavedUser();

      if (cachedUser) {
        set({
          user: cachedUser,
          status: "offline",
          error:
            "Unable to verify your session. Some features may be unavailable until you reconnect.",
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

    if (
      currentState.status === "authenticated" &&
      currentState.user
    ) {
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
