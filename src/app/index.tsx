import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import AnnouncementCard, { NewsCard, Post } from "../../components/AnnouncementCard";
import { useAuth } from "../../context/AuthContext";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const RED = ["#7F1D1D", "#DC2626"] as const;

const R = { fontFamily: "REM_REGULAR" } as const;
const B = { fontFamily: "REM_BOLD" } as const;

type ActiveRequest = { id: string; ref: string; doc_type: string; status: string; created_at: string } | null;

const PROGRESS: Record<string, string> = { Submitted: "33%", Processing: "66%", Ready: "100%" };

const STATUS_TEXT: Record<string, string> = {
  Submitted: "Waiting for barangay staff",
  Processing: "Being processed",
  Ready: "Ready for pickup",
  Rejected: "Not approved. Please contact the barangay office.",
};

/** Tracks the resident's most recent document request, whatever its status. */
function ActiveRequestCard({ r, onPress }: { r: NonNullable<ActiveRequest>; onPress: () => void }) {
  const ready = r.status === "Ready";
  const rejected = r.status === "Rejected";
  const finished = ready || rejected;
  const color = rejected ? "#7A1F00" : ready ? "#14532D" : "#3B2300";

  const content = (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#3B2300", fontSize: 15, fontFamily: "REM_BOLD" }}>
          {finished ? "Your Latest Request" : "Your Active Request"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          {ready ? <Ionicons name="checkmark-circle" size={13} color={color} /> : null}
          {rejected ? <Ionicons name="close-circle" size={13} color={color} /> : null}
          <Text style={{ color, fontSize: 11, fontFamily: "REM_BOLD" }}>{r.status}</Text>
        </View>
      </View>

      <Text style={{ color: "#3B2300", fontSize: 14, fontFamily: "REM_REGULAR" }}>{r.doc_type}</Text>
      <Text style={{ color, fontSize: 11, fontFamily: "REM_REGULAR" }}>
        {r.ref} · {STATUS_TEXT[r.status] ?? r.status}
      </Text>

      {!rejected && (
        <View style={{ backgroundColor: "rgba(255,255,255,0.5)", height: 8, borderRadius: 4, marginTop: 6 }}>
          <View
            style={{
              backgroundColor: ready ? "#4CAF6A" : "#C2410C",
              height: 8,
              borderRadius: 4,
              width: (PROGRESS[r.status] ?? "33%") as any,
            }}
          />
        </View>
      )}
    </View>
  );

  return (
    <Pressable onPress={onPress}>
      {finished ? (
        <View style={{ borderRadius: 16, padding: 16, backgroundColor: ready ? "#CDEFD3" : "#FDE2E0" }}>
          {content}
        </View>
      ) : (
        <Gradient style={{ borderRadius: 16, padding: 16 }}>{content}</Gradient>
      )}
    </Pressable>
  );
}

function Gradient({ children, style }: any) {
  return (
    <LinearGradient colors={ORANGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export default function Home() {
  const router = useRouter();
  const { userId } = useAuth();
  const [showEvents, setShowEvents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const posts = useCached<Post[]>("announcements", async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, category, title, body, location, urgent, event_date, event_time, image_path, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Post[];
  });

  const profile = useCached<{ full_name: string | null }>(
    userId ? `home-profile:${userId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    }
  );

  // most recent request, whatever its status
  const request = useCached<ActiveRequest>(userId ? `home-latest-request:${userId}` : null, async () => {
    const { data, error } = await supabase
      .from("document_requests")
      .select("id, ref, doc_type, status, created_at")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] ?? null;
  });

  // live updates: when an official changes the status, the card updates right away
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`home-latest-request:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_requests", filter: `user_id=eq.${userId}` },
        () => request.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, request.refresh]);

  const refreshAll = useCallback(async () => {
    await Promise.all([posts.refresh(), profile.refresh(), request.refresh()]);
  }, [posts.refresh, profile.refresh, request.refresh]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const all = posts.data ?? [];
  const news = all
    .filter((p) => p.category !== "Event")
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);
  const events = all.filter((p) => p.category === "Event" && p.event_date);

  const fullName = profile.data?.full_name?.trim() || "Resident";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

  const active = request.data;

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          backgroundColor: "#FFB85C",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 1,
        }}
      >
        {/* Extension that fills the bounce gap above the header */}
        <LinearGradient
          colors={["#FFD966", "#FFB95A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600 }}
        />

        <Gradient
          style={{
            paddingTop: 48,
            paddingHorizontal: 16,
            paddingBottom: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
          }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-ink" style={R}>Welcome</Text>
          </View>

          <View className="flex-row justify-between items-center" style={{ paddingRight: 20 }}>
            <Text className="text-ink text-2xl" style={[B, { flex: 1 }]} numberOfLines={1}>
              {fullName}!
            </Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Ionicons name="notifications" size={24} color="#3B2300" />
              <Pressable
                onPress={() => router.navigate("/profile")}
                className="bg-orange-700 w-9 h-9 rounded-full items-center justify-center"
              >
                <Text className="text-white" style={B}>{initials}</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-ink text-xs" style={R}>Barangay Bagong Anyo, Liliw, Laguna</Text>
        </Gradient>
      </View>

      <View className="px-4 mt-4" style={{ gap: 12 }}>
        <View className="flex-row" style={{ gap: 12 }}>
          <Pressable className="flex-1" onPress={() => router.push("/document-request")}>
            <Gradient style={{ borderRadius: 16, padding: 16, minHeight: 90, justifyContent: "flex-end" }}>
              <Ionicons name="document-text-outline" size={24} color="#3B2300" />
              <Text className="text-ink mt-1" style={B}>Document Request</Text>
            </Gradient>
          </Pressable>
          <Pressable className="flex-1" onPress={() => router.push("/report-incident")}>
            <Gradient style={{ borderRadius: 16, padding: 16, minHeight: 90, justifyContent: "flex-end" }}>
              <Ionicons name="megaphone-outline" size={24} color="#3B2300" />
              <Text className="text-ink mt-1" style={B}>Report Incident</Text>
            </Gradient>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/sos")}>
          <LinearGradient
            colors={RED}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Ionicons name="warning" size={28} color="white" />
            <View>
              <Text className="text-white text-lg" style={B}>Emergency SOS</Text>
              <Text className="text-white text-xs" style={R}>Hold 3 seconds to send</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {active && <ActiveRequestCard r={active} onPress={() => router.navigate("/requests")} />}

        <View className="flex-row justify-between items-center mt-2" style={{ paddingBottom: 4 }}>
          <Text className="text-ink text-base" style={B}>Announcements</Text>
          <Pressable onPress={() => router.push("/announcements")}>
            <Text className="text-orange-700 text-sm" style={B}>See all</Text>
          </Pressable>
        </View>
      </View>

      {/* All upcoming events (each card opens its own preview popup) */}
      <Modal
        visible={showEvents}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowEvents(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 }}>
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowEvents(false)}
          />

          <View style={{ height: "75%", backgroundColor: "#FFF3CC", borderRadius: 28, padding: 20 }}>
            <View className="flex-row items-center mb-4">
              <Pressable onPress={() => setShowEvents(false)} style={{ width: 40 }}>
                <Ionicons name="chevron-back" size={28} color="#3B2300" />
              </Pressable>
              <Text className="text-ink text-lg flex-1 text-center" style={B}>Upcoming Events</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {events.length === 0 ? (
                <Text className="text-ink text-center" style={R}>No upcoming events.</Text>
              ) : (
                events.map((e) => <AnnouncementCard key={e.id} post={e} compact/>)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {posts.offline && (
        <Text
          style={{
            color: "#7A3E00",
            backgroundColor: "#FFD9A8",
            borderRadius: 16,
            padding: 8,
            marginHorizontal: 16,
            marginBottom: 8,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "REM_BOLD",
          }}
        >
          Couldn't reach the server. Showing saved data.
        </Text>
      )}

      {posts.loading ? (
        <Text className="text-ink text-center" style={R}>Loading...</Text>
      ) : news.length === 0 ? (
        <Text className="text-ink text-center text-xs" style={R}>No announcements yet.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {news.map((a) => (
            <NewsCard key={a.id} post={a} />
          ))}
        </ScrollView>
      )}

      <View className="px-4 mt-4" style={{ gap: 8 }}>
        <View className="flex-row justify-between items-center">
          <Text className="text-ink text-base" style={B}>Upcoming Events</Text>
          <Pressable onPress={() => setShowEvents(true)}>
            <Text className="text-orange-700 text-sm" style={B}>See all</Text>
          </Pressable>
        </View>

        {events.length === 0 ? (
          <Text className="text-ink text-xs" style={R}>No upcoming events.</Text>
        ) : (
          events.slice(0, 3).map((e) => <AnnouncementCard key={e.id} post={e} compact />)        )}
      </View>
    </ScrollView>
  );
}