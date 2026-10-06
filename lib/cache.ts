import AsyncStorage from "@react-native-async-storage/async-storage";

export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<{ data: T | null; fromCache: boolean }> {
  try {
    const data = await fetcher();
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(data));
    return { data, fromCache: false };
  } catch {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    return { data: raw ? (JSON.parse(raw) as T) : null, fromCache: true };
  }
}