import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";
import {
  ActionButton,
  Card,
  Chip,
  EmptyState,
  FilterTabs,
  GOLD,
  INK,
  MUTED,
  Page,
  PLACEHOLDER,
} from "../../components/ui";

const CATEGORIES = ["Announcement", "Advisory", "Event"] as const;
type Category = (typeof CATEGORIES)[number];

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

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Announcement: { bg: "#FFF1C2", text: "#6B4A00" },
  Advisory: { bg: "#FFD9A8", text: "#7A3E00" },
  Event: { bg: "#CDEFD3", text: "#14532D" },
};

// TODO: load and save posts with your backend
const INITIAL: Post[] = [
  { id: 1, category: "Advisory", title: "Water interruption this Sunday", body: "No water from 8 AM to 4 PM due to pipe repairs. Please store water ahead of time.", when: "Posted today", urgent: true },
  { id: 2, category: "Announcement", title: "Free pet vaccination", body: "Bring your pets to the barangay hall. First come, first served.", when: "Oct 1", urgent: false },
  { id: 3, category: "Event", title: "Barangay assembly", body: "All residents are invited.", when: "Sep 28", urgent: false, eventDate: "Oct 12", eventTime: "2:00 PM" },
];

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={PLACEHOLDER}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={{
        backgroundColor: "#FFF1C7",
        borderRadius: multiline ? 20 : 28,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 0,
        minHeight: multiline ? 100 : 48,
        color: INK,
        fontSize: 14,
        fontFamily: "REM_REGULAR",
      }}
    />
  );
}

export default function AnnouncementsManage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);

  const [category, setCategory] = useState<Category>("Announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [urgent, setUrgent] = useState(false);

  const resetForm = () => {
    setCategory("Announcement");
    setTitle("");
    setBody("");
    setEventDate("");
    setEventTime("");
    setUrgent(false);
  };

  const publish = () => {
    if (!title.trim()) return Alert.alert("Missing info", "Enter a title.");
    if (!body.trim()) return Alert.alert("Missing info", "Write the details.");
    if (category === "Event" && (!eventDate.trim() || !eventTime.trim()))
      return Alert.alert("Missing info", "Enter the event date and time.");

    const post: Post = {
      id: Date.now(),
      category,
      title: title.trim(),
      body: body.trim(),
      when: "Posted just now",
      urgent,
      ...(category === "Event" ? { eventDate: eventDate.trim(), eventTime: eventTime.trim() } : {}),
    };

    // TODO: send `post` to your backend (and push a notification if `urgent`)
    setPosts((p) => [post, ...p]);
    resetForm();
    setShowForm(false);
  };

  const remove = (p: Post) =>
    Alert.alert("Delete post?", `"${p.title}" will disappear for all residents.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setPosts((l) => l.filter((x) => x.id !== p.id)) },
    ]);

  return (
    <Page title="Announcements" variant="official">
      {!showForm ? (
        <Pressable
          onPress={() => setShowForm(true)}
          style={{ backgroundColor: INK, borderRadius: 32, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Ionicons name="add-circle-outline" size={22} color={GOLD} />
          <Text style={{ color: GOLD, fontSize: 15, fontFamily: "REM_BOLD" }}>New post</Text>
        </Pressable>
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>New post</Text>

          <FilterTabs options={CATEGORIES} value={category} onChange={setCategory} />

          <Input value={title} onChangeText={setTitle} placeholder="Title" />
          <Input value={body} onChangeText={setBody} placeholder="Details residents should know" multiline />

          {category === "Event" && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input value={eventDate} onChangeText={setEventDate} placeholder="Date (Oct 12)" />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={eventTime} onChangeText={setEventTime} placeholder="Time (2:00 PM)" />
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Mark as urgent</Text>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>Pins it to the top and alerts residents</Text>
            </View>
            <Switch value={urgent} onValueChange={setUrgent} trackColor={{ false: "#E5D3A8", true: "#FF9A4D" }} thumbColor="#fff" />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <ActionButton label="Cancel" tone="ghost" onPress={() => { resetForm(); setShowForm(false); }} />
            <ActionButton label="Publish" icon="send-outline" onPress={publish} />
          </View>
        </Card>
      )}

      <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD", marginLeft: 4 }}>Posted ({posts.length})</Text>

      {posts.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="No posts yet" sub="Residents will see your posts on their home screen." />
      ) : (
        posts.map((p) => {
          const c = CATEGORY_COLORS[p.category];
          return (
            <Card key={p.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Chip label={p.category} bg={c.bg} text={c.text} />
                {p.urgent && <Chip label="Urgent" bg="#FFC9B8" text="#7A1F00" />}
                <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{p.when}</Text>
              </View>
              <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>{p.title}</Text>
              <Text style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}>{p.body}</Text>
              {p.eventDate && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={MUTED} />
                  <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_BOLD" }}>
                    {p.eventDate} · {p.eventTime}
                  </Text>
                </View>
              )}
              <Pressable onPress={() => remove(p)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end" }}>
                <Ionicons name="trash-outline" size={16} color="#D92D20" />
                <Text style={{ color: "#D92D20", fontSize: 12, fontFamily: "REM_BOLD" }}>Delete</Text>
              </Pressable>
            </Card>
          );
        })
      )}
    </Page>
  );
}