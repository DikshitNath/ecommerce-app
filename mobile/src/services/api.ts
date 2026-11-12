
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the saved JWT to protected API requests.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Check whether the backend server is reachable.
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await api.get("/health", {
      timeout: 5000,
    });

    return true;
  } catch {
    return false;
  }
};
