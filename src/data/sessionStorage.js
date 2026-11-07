import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Keep native sessions in OS-backed storage. Chunk long auth sessions to avoid
// relying on a device's SecureStore value-size limit.
export const sessionStorage = {
  async getItem(key) {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    const manifest = await SecureStore.getItemAsync(`${key}.manifest`);
    if (!manifest) return null;
    const { generation, count } = JSON.parse(manifest);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, n) =>
        SecureStore.getItemAsync(`${key}.${generation}.${n}`),
      ),
    );
    return chunks.some((part) => part === null) ? null : chunks.join("");
  },
  async setItem(key, value) {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    const previous = await SecureStore.getItemAsync(`${key}.manifest`);
    const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const count = Math.ceil(value.length / 1500);
    await Promise.all(
      Array.from({ length: count }, (_, n) =>
        SecureStore.setItemAsync(
          `${key}.${generation}.${n}`,
          value.slice(n * 1500, (n + 1) * 1500),
        ),
      ),
    );
    await SecureStore.setItemAsync(
      `${key}.manifest`,
      JSON.stringify({ generation, count }),
    );
    if (previous) {
      const old = JSON.parse(previous);
      await Promise.all(
        Array.from({ length: old.count }, (_, n) =>
          SecureStore.deleteItemAsync(`${key}.${old.generation}.${n}`),
        ),
      );
    }
  },
  async removeItem(key) {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    const manifest = await SecureStore.getItemAsync(`${key}.manifest`);
    await SecureStore.deleteItemAsync(`${key}.manifest`);
    if (manifest) {
      const old = JSON.parse(manifest);
      await Promise.all(
        Array.from({ length: old.count }, (_, n) =>
          SecureStore.deleteItemAsync(`${key}.${old.generation}.${n}`),
        ),
      );
    }
  },
};
