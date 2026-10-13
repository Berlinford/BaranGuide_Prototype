import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyState, IconName, INK, MUTED, Page, RED } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Note = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  route: string | null;
  read: boolean;
  created_at: string;
};

const LOOK: Record<string, { icon: IconName; color: string }> = {
  request_new: { icon: "document-text-outline", color: "#FFD966" },
  request_update: { icon: "document-text-outline", color: "#CDEFD3" },
  sos_new: { icon: "warning-outline", color: "#FFC9B8" },
  sos_update: { icon: "shield-checkmark-outline", color: "#FFD9A8" },
  announcement: { icon: "megaphone-outline", color: "#FFD9A8" },
  event: { icon: "calendar-outline", color: "#FFD966" },
  approval: { icon: "person-add-outline", color: "#FFF1C2" },
};
const FALLBACK = { icon: "notifications-outline" as IconName, color: "#FFF1C2" };

function ago(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr ago`;
  if (mins < 2880) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const router = useRouter();
  const { role, userId } = useAuth();
  const official = role === "official";
  const [refreshing, setRefreshing] = useState(false);
  const [readNow, setReadNow] = useState<Set<string>>(new Set()); // marked read on this phone, instantly

  const { data, loading, offline, refresh } = useCached<Note[]>(
    userId ? `notifications:${userId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, route, read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Note[];
    }
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // new notifications appear live
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-screen-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const items = (data ?? []).map((n) => ({ ...n, read: n.read || readNow.has(n.id) }));
  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setReadNow((s) => new Set(s).add(id));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAll = async () => {
    setReadNow(new Set(items.map((n) => n.id)));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId!).eq("read", false);
    refresh();
  };

  const open = (n: Note) => {
    if (!n.read) markRead(n.id);
    if (n.route) router.navigate(n.route as any);
  };

  return (
    <Page
      title="Notifications"
      variant={official ? "official" : "resident"}
      refreshing={refreshing}
      onRefresh={onRefresh}
      right={
        unread > 0 ? (
          <Pressable onPress={markAll} hitSlop={10}>
            <Text style={{ color: official ? "#FFD966" : INK, fontSize: 12, fontFamily: "REM_BOLD" }}>
              Mark all read
            </Text>
          </Pressable>
        ) : undefined
      }
    >
      {offline && (
        <Text
          style={{
            color: "#7A3E00",
            backgroundColor: "#FFD9A8",
            borderRadius: 16,
            padding: 8,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "REM_BOLD",
          }}
        >
          Couldn't reach the server. Showing saved notifications.
        </Text>
      )}

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="You're all caught up"
          sub="Updates about your account will show up here."
        />
      ) : (
        items.map((n) => {
          const look = LOOK[n.type] ?? FALLBACK;
          return (
            <Pressable
              key={n.id}
              onPress={() => open(n)}
              style={{
                backgroundColor: n.read ? "rgba(255,255,255,0.65)" : "#fff",
                borderRadius: 24,
                padding: 14,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: look.color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={look.icon} size={22} color={INK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: INK, fontSize: 14, fontFamily: n.read ? "REM_REGULAR" : "REM_BOLD" }}>
                  {n.title}
                </Text>
                {n.body ? (
                  <Text numberOfLines={2} style={{ color: MUTED, fontSize: 12, marginTop: 1, fontFamily: "REM_REGULAR" }}>
                    {n.body}
                  </Text>
                ) : null}
                <Text style={{ color: MUTED, fontSize: 11, marginTop: 4, fontFamily: "REM_REGULAR" }}>
                  {ago(n.created_at)}
                </Text>
              </View>
              {!n.read && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RED }} />}
              {n.route ? <Ionicons name="chevron-forward" size={16} color={MUTED} /> : null}
            </Pressable>
          );
        })
      )}
    </Page>
  );
}