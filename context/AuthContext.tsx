import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type Role = "resident" | "official";
type Snapshot = { userId: string; role: Role };
type Auth = {
  token: string | null;
  userId: string | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const KEY = "auth_snapshot";
const AuthContext = createContext<Auth>({} as Auth);
export const useAuth = () => useContext(AuthContext);

const readCache = async (): Promise<Snapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (s: Session | null, event: string) => {
    setSession(s);
    if (s) {
      const { data, error } = await supabase
        .from("profiles").select("role,status").eq("id", s.user.id).single();
      if (!error && data) {
        if (data.status === "approved") {
          const next = { userId: s.user.id, role: data.role as Role };
          setSnap(next);
          await AsyncStorage.setItem(KEY, JSON.stringify(next));
        } else {
          setSnap(null);
          await AsyncStorage.removeItem(KEY);
        }
      } else {
        const cached = await readCache(); // offline: use the saved copy
        setSnap(cached?.userId === s.user.id ? cached : null);
      }
    } else if (event === "INITIAL_SESSION") {
      setSnap(await readCache()); // offline with an expired token
    } else {
      setSnap(null);
      await AsyncStorage.removeItem(KEY);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setTimeout(() => load(s, event), 0); // defer to avoid a Supabase deadlock
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setSnap(null);
    const keys = (await AsyncStorage.getAllKeys()).filter(
      (k) => k === KEY || k.startsWith("cache:") || k === "queue"
    );
    await AsyncStorage.multiRemove(keys);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        token: session?.access_token ?? (snap ? "offline" : null),
        userId: session?.user.id ?? snap?.userId ?? null,
        role: snap?.role ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}