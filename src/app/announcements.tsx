import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Card, Chip, EmptyState, FilterTabs, INK, MUTED, Page } from "../../components/ui";
import { useCached } from "../../lib/offline";
import { announcementImageUrl } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

type Category = "Announcement" | "Advisory" | "Event";
type Post = {
  id: string;
  category: Category;
  title: string;
  body: string;
  urgent: boolean;
  event_date: string | null;
  event_time: string | null;
  image_path: string | null;
  created_at: string;
};

const FILTERS = ["All", "Announcement", "Advisory", "Event"] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Announcement: { bg: "#FFF1C2", text: "#6B4A00" },
  Advisory: { bg: "#FFD9A8", text: "#7A3E00" },
  Event: { bg: "#CDEFD3", text: "#14532D" },
};

const whenLabel = (iso: string) => {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return "Posted today";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

export default function Announcements() {
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, offline, refresh } = useCached<Post[]>("announcements", async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, category, title, body, urgent, event_date, event_time, image_path, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Post[];
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // urgent first, then newest
  const shown = (data ?? [])
    .filter((p) => filter === "All" || p.category === filter)
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <Page title="Announcements" refreshing={refreshing} onRefresh={onRefresh}>
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />

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
          Couldn't reach the server. Showing saved data.
        </Text>
      )}

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="Nothing here yet" sub="Barangay news will show up here." />
      ) : (
        shown.map((p) => {
          const open = openId === p.id;
          const c = CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.Announcement;
          const img = announcementImageUrl(p.image_path);
          return (
            <Pressable key={p.id} onPress={() => setOpenId(open ? null : p.id)}>
              <Card style={{ gap: 8, borderWidth: p.urgent ? 2 : 0, borderColor: "#FF9A4D" }}>
                {img ? (
                  <Image
                    source={{ uri: img }}
                    style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: "#FFE0B0" }}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Chip label={p.category} bg={c.bg} text={c.text} />
                  {p.urgent && <Chip label="Urgent" bg="#FFC9B8" text="#7A1F00" />}
                  <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {whenLabel(p.created_at)}
                  </Text>
                </View>
                <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>{p.title}</Text>
                {p.event_date && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="calendar-outline" size={14} color={MUTED} />
                    <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_BOLD" }}>
                      {p.event_date} · {p.event_time}
                    </Text>
                  </View>
                )}
                <Text
                  numberOfLines={open ? undefined : 2}
                  style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}
                >
                  {p.body}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}
    </Page>
  );
}