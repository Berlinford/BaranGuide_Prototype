import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, Chip, EmptyState, FilterTabs, INK, MUTED, Page } from "../../components/ui";

type Category = "Announcement" | "Advisory" | "Event";
type Post = {
  id: number;
  category: Category;
  title: string;
  body: string;
  when: string;
  urgent: boolean;
  eventDate?: string;
  eventTime?: string;
};

const FILTERS = ["All", "Announcement", "Advisory", "Event"] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Announcement: { bg: "#FFF1C2", text: "#6B4A00" },
  Advisory: { bg: "#FFD9A8", text: "#7A3E00" },
  Event: { bg: "#CDEFD3", text: "#14532D" },
};

// TODO: load the posts officials publish from your backend
const POSTS: Post[] = [
  { id: 1, category: "Advisory", title: "Water interruption this Sunday", body: "No water from 8 AM to 4 PM due to pipe repairs. Please store water ahead of time.", when: "Posted today", urgent: true },
  { id: 2, category: "Announcement", title: "Free pet vaccination", body: "Bring your pets to the barangay hall. First come, first served.", when: "Oct 1", urgent: false },
  { id: 3, category: "Event", title: "Barangay assembly", body: "All residents are invited to the quarterly assembly.", when: "Sep 28", urgent: false, eventDate: "Oct 12", eventTime: "2:00 PM" },
  { id: 4, category: "Event", title: "Community clean-up", body: "Bring gloves and a trash bag. Drinks provided.", when: "Sep 25", urgent: false, eventDate: "Oct 25", eventTime: "9:00 AM" },
];

export default function Announcements() {
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<number | null>(null);

  // urgent first, then newest
  const shown = POSTS.filter((p) => filter === "All" || p.category === filter).sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || b.id - a.id
  );

  return (
    <Page title="Announcements">
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      {shown.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="Nothing here yet" sub="Barangay news will show up here." />
      ) : (
        shown.map((p) => {
          const open = openId === p.id;
          const c = CATEGORY_COLORS[p.category];
          return (
            <Pressable key={p.id} onPress={() => setOpenId(open ? null : p.id)}>
              <Card style={{ gap: 8, borderWidth: p.urgent ? 2 : 0, borderColor: "#FF9A4D" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Chip label={p.category} bg={c.bg} text={c.text} />
                  {p.urgent && <Chip label="Urgent" bg="#FFC9B8" text="#7A1F00" />}
                  <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{p.when}</Text>
                </View>
                <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>{p.title}</Text>
                {p.eventDate && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="calendar-outline" size={14} color={MUTED} />
                    <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_BOLD" }}>
                      {p.eventDate} · {p.eventTime}
                    </Text>
                  </View>
                )}
                <Text numberOfLines={open ? undefined : 2} style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}>
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