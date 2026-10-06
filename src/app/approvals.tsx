import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";

type Pending = {
  id: string; full_name: string | null; contact: string | null; email: string | null;
  birthdate: string | null; address: string | null; purok: string | null;
};

export default function Approvals() {
  const router = useRouter();
  const [items, setItems] = useState<Pending[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,contact,email,birthdate,address,purok")
      .eq("status", "pending")
      .eq("requested_role", "resident")
      .order("created_at", { ascending: true });
    if (error) {
      Alert.alert("Couldn't load", error.message);
      setLoading(false);
      return;
    }
    setItems(data ?? []);
    setLoading(false);

    // signed links so officials can view each ID (valid for 10 minutes)
    const urls: Record<string, string> = {};
    for (const p of data ?? []) {
      const { data: s } = await supabase.storage.from("ids").createSignedUrl(`${p.id}/id.jpg`, 600);
      if (s?.signedUrl) urls[p.id] = s.signedUrl;
    }
    setPhotos(urls);
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = (p: Pending, decision: "approved" | "rejected") => {
    Alert.alert(
      decision === "approved" ? "Approve resident?" : "Reject resident?",
      p.full_name ?? "",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: decision === "approved" ? "Approve" : "Reject",
          style: decision === "approved" ? "default" : "destructive",
          onPress: async () => {
            setBusy(p.id);
            const { error } = await supabase.rpc("review_resident", { target: p.id, decision });
            setBusy(null);
            if (error) return Alert.alert("Failed", error.message);
            setItems((list) => list.filter((x) => x.id !== p.id));
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFF1C7" }} contentContainerStyle={{ paddingBottom: 130 }}>
      <LinearGradient colors={ORANGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.navigate("/official-home" as any)} hitSlop={12} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={28} color={INK} />
          </Pressable>
          <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Resident approvals</Text>
        </View>
      </LinearGradient>

      <View style={{ padding: 20, gap: 14 }}>
        {loading ? (
          <ActivityIndicator color={INK} />
        ) : items.length === 0 ? (
          <Text style={{ color: MUTED, textAlign: "center", fontFamily: "REM_REGULAR" }}>No pending registrations.</Text>
        ) : (
          items.map((p) => (
            <View key={p.id} style={{ backgroundColor: "#fff", borderRadius: 24, padding: 14, gap: 6 }}>
              <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>{p.full_name}</Text>
              <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                {p.contact} · {p.email}
              </Text>
              <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                {p.birthdate} · {p.address}, {p.purok}
              </Text>
              {photos[p.id] ? (
                <Image source={{ uri: photos[p.id] }} style={{ width: "100%", height: 180, borderRadius: 16, marginTop: 6 }} resizeMode="contain" />
              ) : null}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <Pressable disabled={busy === p.id} onPress={() => review(p, "rejected")}
                  style={{ flex: 1, backgroundColor: "#FDE2E0", borderRadius: 24, paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ color: "#D92D20", fontFamily: "REM_BOLD" }}>Reject</Text>
                </Pressable>
                <Pressable disabled={busy === p.id} onPress={() => review(p, "approved")}
                  style={{ flex: 1, backgroundColor: "#CDEFD3", borderRadius: 24, paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ color: "#14532D", fontFamily: "REM_BOLD" }}>Approve</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}