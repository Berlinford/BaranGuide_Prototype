import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CREAM, DARK, GOLD, IconName, INK, MUTED, RED } from "../../components/ui";

// TODO: replace everything below with data from your backend
const OFFICIAL = { name: "Juan Dela Cruz", position: "Kagawad" };
const UNREAD = 4;

const SOS_ALERTS = [
  { id: 1, type: "Medical", where: "Mabini St., Purok 3", resident: "Maria Santos", ago: "2 min ago" },
  { id: 2, type: "Fire", where: "Rizal Ave., Purok 1", resident: "Pedro Reyes", ago: "11 min ago" },
];

const STATS: { label: string; value: number; icon: IconName; route: string; tint: string }[] = [
  { label: "Pending requests", value: 8, icon: "document-text-outline", route: "/official-requests", tint: "#FFD966" },
  { label: "New reports", value: 5, icon: "megaphone-outline", route: "/official-reports", tint: "#FFD9A8" },
  { label: "Residents to approve", value: 3, icon: "person-add-outline", route: "/approvals", tint: "#FFF1C2" },
  { label: "Resolved this week", value: 12, icon: "checkmark-done-outline", route: "/official-reports", tint: "#CDEFD3" },
];

const ACTIONS: { label: string; sub: string; icon: IconName; route: string }[] = [
  { label: "Document requests", sub: "Process and release certificates", icon: "document-text-outline", route: "/official-requests" },
  { label: "Incident reports", sub: "Check and update report status", icon: "alert-circle-outline", route: "/official-reports" },
  { label: "Resident approvals", sub: "Verify new sign-ups", icon: "people-outline", route: "/approvals" },
  { label: "Announcements", sub: "Post news, advisories and events", icon: "megaphone-outline", route: "/announcements-manage" },
  { label: "Resident directory", sub: "Look up residents", icon: "book-outline", route: "/residents" },
];

const ACTIVITY: { id: number; icon: IconName; text: string; ago: string; color: string }[] = [
  { id: 1, icon: "alert-circle-outline", text: "New incident: Broken streetlight, Purok 3", ago: "5 min ago", color: "#FFD9A8" },
  { id: 2, icon: "document-text-outline", text: "Barangay Clearance requested by A. Cruz", ago: "32 min ago", color: "#FFD966" },
  { id: 3, icon: "person-add-outline", text: "New resident sign-up awaiting approval", ago: "1 hr ago", color: "#FFF1C2" },
  { id: 4, icon: "checkmark-done-outline", text: "Flooding report marked resolved", ago: "3 hrs ago", color: "#CDEFD3" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD", marginBottom: 10, marginLeft: 4 }}>{children}</Text>;
}

export default function OfficialHome() {
  const router = useRouter();
  const go = (path: string) => router.navigate(path as any);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CREAM }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Dark header: this is what sets the officials' side apart */}
      <View
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          backgroundColor: "#3A2304",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 1,
        }}
      >
        <LinearGradient
          colors={DARK}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600 }}
        />
        <LinearGradient
          colors={DARK}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 48,
            paddingHorizontal: 20,
            paddingBottom: 22,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#C9A870", fontSize: 13, fontFamily: "REM_REGULAR" }}>{greeting()}</Text>
              <Text numberOfLines={1} style={{ color: GOLD, fontSize: 22, fontFamily: "REM_BOLD", marginTop: 2 }}>
                {OFFICIAL.position} {OFFICIAL.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  alignSelf: "flex-start",
                  backgroundColor: GOLD,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  marginTop: 8,
                }}
              >
                <Ionicons name="shield-checkmark" size={12} color={INK} />
                <Text style={{ color: INK, fontSize: 11, fontFamily: "REM_BOLD" }}>Barangay Official</Text>
              </View>
            </View>

            <Pressable
              onPress={() => go("/settings")}
              hitSlop={10}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,217,102,0.15)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="settings-outline" size={22} color={GOLD} />
            </Pressable>

            <Pressable
              onPress={() => go("/notifications")}
              hitSlop={10}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,217,102,0.15)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="notifications-outline" size={22} color={GOLD} />
              {UNREAD > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: RED,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10, fontFamily: "REM_BOLD" }}>{UNREAD}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 22 }}>
        {SOS_ALERTS.length > 0 && (
          <View style={{ backgroundColor: "#FFE3DF", borderRadius: 24, padding: 14, gap: 10, borderWidth: 2, borderColor: RED }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="warning" size={20} color="#fff" />
              </View>
              <Text style={{ flex: 1, color: "#7A1F00", fontSize: 15, fontFamily: "REM_BOLD" }}>
                {SOS_ALERTS.length} active SOS {SOS_ALERTS.length === 1 ? "alert" : "alerts"}
              </Text>
              <Pressable onPress={() => go("/sos-alerts")} hitSlop={8}>
                <Text style={{ color: "#7A1F00", fontSize: 12, fontFamily: "REM_BOLD" }}>View all</Text>
              </Pressable>
            </View>

            {SOS_ALERTS.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => go("/sos-alerts")}
                style={{ backgroundColor: "#fff", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
                    {a.type} · {a.resident}
                  </Text>
                  <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                    {a.where} · {a.ago}
                  </Text>
                </View>
                <View style={{ backgroundColor: RED, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontFamily: "REM_BOLD" }}>Respond</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View>
          <SectionTitle>Overview</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {STATS.map((s) => (
              <Pressable
                key={s.label}
                onPress={() => go(s.route)}
                style={{ width: "47.8%", backgroundColor: "#fff", borderRadius: 24, padding: 14, gap: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: s.tint, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={s.icon} size={22} color={INK} />
                </View>
                <View>
                  <Text style={{ color: INK, fontSize: 28, fontFamily: "REM_BOLD" }}>{s.value}</Text>
                  <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>{s.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>Manage</SectionTitle>
          <View style={{ gap: 10 }}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => go(a.route)}
                style={{ backgroundColor: "#fff", borderRadius: 32, paddingVertical: 10, paddingLeft: 10, paddingRight: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={a.icon} size={24} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{a.label}</Text>
                  <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>{a.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>Recent activity</SectionTitle>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, paddingVertical: 4, paddingHorizontal: 14 }}>
            {ACTIVITY.map((a, i) => (
              <View
                key={a.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: i === ACTIVITY.length - 1 ? 0 : 1,
                  borderBottomColor: "#F5E6BE",
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={a.icon} size={18} color={INK} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>{a.text}</Text>
                  <Text style={{ color: MUTED, fontSize: 11, marginTop: 1, fontFamily: "REM_REGULAR" }}>{a.ago}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}