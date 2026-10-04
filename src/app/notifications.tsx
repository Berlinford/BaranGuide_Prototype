import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyState, IconName, INK, MUTED, Page, RED } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

type Note = { id: number; icon: IconName; title: string; body: string; ago: string; read: boolean; color: string };

// TODO: load these from your backend (and mark them read there too)
const RESIDENT_NOTES: Note[] = [
  { id: 1, icon: "document-text-outline", title: "Your Barangay Clearance is ready", body: "You can pick it up at the barangay hall.", ago: "10 min ago", read: false, color: "#CDEFD3" },
  { id: 2, icon: "megaphone-outline", title: "Water interruption this Sunday", body: "No water from 8 AM to 4 PM.", ago: "2 hrs ago", read: false, color: "#FFD9A8" },
  { id: 3, icon: "alert-circle-outline", title: "Report IR-0042 is in progress", body: "Electrician scheduled this week.", ago: "Yesterday", read: true, color: "#FFF1C2" },
  { id: 4, icon: "calendar-outline", title: "Barangay assembly on Oct 12", body: "2:00 PM at the barangay hall.", ago: "Oct 1", read: true, color: "#FFD966" },
];

const OFFICIAL_NOTES: Note[] = [
  { id: 1, icon: "warning-outline", title: "New SOS alert: Medical", body: "Mabini St., Purok 3", ago: "2 min ago", read: false, color: "#FFC9B8" },
  { id: 2, icon: "alert-circle-outline", title: "New incident report: Flooding", body: "Riverside Rd., Purok 5 · Urgent", ago: "20 min ago", read: false, color: "#FFD9A8" },
  { id: 3, icon: "document-text-outline", title: "New document request", body: "Barangay Clearance from Maria Santos", ago: "1 hr ago", read: false, color: "#FFD966" },
  { id: 4, icon: "person-add-outline", title: "2 accounts awaiting approval", body: "Review the new sign-ups.", ago: "3 hrs ago", read: true, color: "#FFF1C2" },
];

export default function Notifications() {
  const { role } = useAuth();
  const official = role === "official";
  const [items, setItems] = useState<Note[]>(official ? OFFICIAL_NOTES : RESIDENT_NOTES);

  const unread = items.filter((i) => !i.read).length;
  const markRead = (id: number) => setItems((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((l) => l.map((n) => ({ ...n, read: true })));

  return (
    <Page
      title="Notifications"
      variant={official ? "official" : "resident"}
      right={
        unread > 0 ? (
          <Pressable onPress={markAll} hitSlop={10}>
            <Text style={{ color: official ? "#FFD966" : INK, fontSize: 12, fontFamily: "REM_BOLD" }}>Mark all read</Text>
          </Pressable>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title="You're all caught up" />
      ) : (
        items.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => markRead(n.id)}
            style={{
              backgroundColor: n.read ? "rgba(255,255,255,0.65)" : "#fff",
              borderRadius: 24,
              padding: 14,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: n.color, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={n.icon} size={22} color={INK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontSize: 14, fontFamily: n.read ? "REM_REGULAR" : "REM_BOLD" }}>{n.title}</Text>
              <Text style={{ color: MUTED, fontSize: 12, marginTop: 1, fontFamily: "REM_REGULAR" }}>{n.body}</Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 4, fontFamily: "REM_REGULAR" }}>{n.ago}</Text>
            </View>
            {!n.read && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RED }} />}
          </Pressable>
        ))
      )}
    </Page>
  );
}