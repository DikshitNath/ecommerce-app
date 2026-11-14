// Polyfills and mocks for React Native / Expo environment in Node.js test runner

// 1. In-memory storage mock for AsyncStorage
export const mockAsyncStorage = new Map<string, string>();

(global as any).localStorage = {
  getItem: (key: string) => mockAsyncStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockAsyncStorage.set(key, String(value)),
  removeItem: (key: string) => mockAsyncStorage.delete(key),
  clear: () => mockAsyncStorage.clear(),
};

(global as any).window = {
  localStorage: (global as any).localStorage,
};

// 2. In-memory storage mock for Expo SecureStore
export const mockSecureStorage = new Map<string, string>();

export const mockSecureStoreModule = {
  getItemAsync: async (key: string) => mockSecureStorage.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mockSecureStorage.set(key, String(value));
  },
  deleteItemAsync: async (key: string) => {
    mockSecureStorage.delete(key);
  },
};

