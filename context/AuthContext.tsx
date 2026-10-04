import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

export type Role = "resident" | "official";

type Auth = {
  token: string | null;
  role: Role | null;
  loading: boolean;
  signIn: (token: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth>({} as Auth);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for a saved login when the app starts
  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync("token");
        const r = await SecureStore.getItemAsync("role");
        if (t && (r === "resident" || r === "official")) {
          setToken(t);
          setRole(r);
        }
      } catch {
        setToken(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (t: string, r: Role) => {
    // Log the user in right away
    setToken(t);
    setRole(r);
    // Saving is best-effort, so a storage problem can't block the login
    try {
      await SecureStore.setItemAsync("token", t);
      await SecureStore.setItemAsync("role", r);
    } catch (e) {
      console.log("Couldn't save login:", e);
    }
  };

  const signOut = async () => {
    setToken(null);
    setRole(null);
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("role");
    } catch (e) {
      console.log("Couldn't clear login:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}