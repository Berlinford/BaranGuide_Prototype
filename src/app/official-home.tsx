import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { CREAM, DARK, GOLD, IconName, INK, MUTED, RED } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUnreadCount } from "../../lib/notifications";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Sos = { id: string; type: string; location: string; resident_name: string | null; created_at: string };
type Activity = { id: string; icon: IconName; text: string; at: string; color: string };
type Dashboard = {
  submitted: number; // new document requests nobody has started
  processing: number; // document requests being worked on
  newReports: number; // incident reports still "Received"
  toApprove: number; // residents waiting for approval
  resolvedWeek: number; // reports resolved in the last 7 days
  sos: Sos[]; // active SOS alerts
  activity: Activity[];
};

const EMPTY: Dashboard = {
  submitted: 0,
  processing: 0,
  newReports: 0,
  toApprove: 0,
  resolvedWeek: 0,
  sos: [],
  activity: [],
};

const ACTIONS: { label: string; sub: string; icon: IconName; route: string }[] = [
  { label: "Document requests", sub: "Process and release certificates", icon: "document-text-outline", route: "/official-requests" },
  { label: "Incident reports", sub: "Check and update report status", icon: "alert-circle-outline", route: "/official-reports" },
  { label: "Resident approvals", sub: "Verify new sign-ups", icon: "people-outline", route: "/approvals" },
  { label: "Announcements", sub: "Post news, advisories and events", icon: "megaphone-outline", route: "/announcements-manage" },
  { label: "Resident directory", sub: "Look up residents", icon: "book-outline", route: "/residents" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function timeAgo(iso: string, now: number) {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hr" : "hrs"} ago`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

// "Ana Cruz" -> "A. Cruz"
function shortName(full?: string | null) {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "a resident";
  if (parts.length === 1) return parts[0];
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD", marginBottom: 10, marginLeft: 4 }}>{children}</Text>;
}

const countOf = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });

export default function OfficialHome() {
  const router = useRouter();
  const { userId } = useAuth();
  const unread = useUnreadCount(userId);
  const go = (path: string) => router.navigate(path as any);

  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  // keeps "5 min ago" labels fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const profile = useCached<{ full_name: string | null; position: string | null }>(
    userId ? `official-profile:${userId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, position")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    }
  );

  const dash = useCached<Dashboard>("official-home", async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      submitted,
      processing,
      newReports,
      toApprove,
      resolvedWeek,
      sos,
      reportsRecent,
      reportsResolved,
      requestsRecent,
      signupsRecent,
    ] = await Promise.all([
      countOf("document_requests").eq("status", "Submitted"),
      countOf("document_requests").eq("status", "Processing"),
      countOf("incident_reports").eq("status", "Received"),
      countOf("profiles").eq("status", "pending").eq("requested_role", "resident"),
      countOf("incident_reports").eq("status", "Resolved").gte("resolved_at", weekAgo),
      supabase
        .from("sos_alerts")
        .select("id, type, location, resident_name, created_at")
        .eq("status", "Active")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("incident_reports")
        .select("id, type, address, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("incident_reports")
        .select("id, type, resolved_at")
        .not("resolved_at", "is", null)
        .order("resolved_at", { ascending: false })
        .limit(5),
      supabase
        .from("document_requests")
        .select("id, doc_type, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("status", "pending")
        .eq("requested_role", "resident")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const all = [
      submitted, processing, newReports, toApprove, resolvedWeek,
      sos, reportsRecent, reportsResolved, requestsRecent, signupsRecent,
    ];
    const failed = all.find((r) => r.error);
    if (failed?.error) throw failed.error;

    const activity: Activity[] = [];
    for (const r of reportsRecent.data ?? []) {
      activity.push({
        id: `report-${r.id}`,
        icon: "alert-circle-outline",
        text: `New incident: ${r.type}, ${r.address}`,
        at: r.created_at,
        color: "#FFD9A8",
      });
    }
    for (const r of reportsResolved.data ?? []) {
      activity.push({
        id: `resolved-${r.id}`,
        icon: "checkmark-done-outline",
        text: `${r.type} report marked resolved`,
        at: r.resolved_at,
        color: "#CDEFD3",
      });
    }
    for (const r of requestsRecent.data ?? []) {
      activity.push({
        id: `request-${r.id}`,
        icon: "document-text-outline",
        text: `${r.doc_type} requested by ${shortName(r.full_name)}`,
        at: r.created_at,
        color: "#FFD966",
      });
    }
    for (const r of signupsRecent.data ?? []) {
      activity.push({
        id: `signup-${r.id}`,
        icon: "person-add-outline",
        text: `${shortName(r.full_name)} signed up and awaits approval`,
        at: r.created_at,
        color: "#FFF1C2",
      });
    }
    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return {
      submitted: submitted.count ?? 0,
      processing: processing.count ?? 0,
      newReports: newReports.count ?? 0,
      toApprove: toApprove.count ?? 0,
      resolvedWeek: resolvedWeek.count ?? 0,
      sos: (sos.data ?? []) as Sos[],
      activity: activity.slice(0, 6),
    };
  });

  // live updates: anything that changes one of these tables refreshes the dashboard
  useEffect(() => {
    const channel = supabase
      .channel("official-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => dash.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () => dash.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "document_requests" }, () => dash.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        dash.refresh();
        profile.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dash.refresh, profile.refresh]);

  useFocusEffect(
    useCallback(() => {
      dash.refresh();
      profile.refresh();
    }, [dash.refresh, profile.refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dash.refresh(), profile.refresh()]);
    setRefreshing(false);
  };

  const d = dash.data ?? EMPTY;
  const me = profile.data;
  const displayName = [me?.position, me?.full_name].filter(Boolean).join(" ") || "Barangay Official";

  const stats: { label: string; value: number; icon: IconName; route: string; tint: string }[] = [
    { label: "Pending requests", value: d.submitted + d.processing, icon: "document-text-outline", route: "/official-requests", tint: "#FFD966" },
    { label: "New reports", value: d.newReports, icon: "megaphone-outline", route: "/official-reports", tint: "#FFD9A8" },
    { label: "Residents to approve", value: d.toApprove, icon: "person-add-outline", route: "/approvals", tint: "#FFF1C2" },
    { label: "Resolved this week", value: d.resolvedWeek, icon: "checkmark-done-outline", route: "/official-reports", tint: "#CDEFD3" },
  ];

  // the bell counts everything waiting for an official
  const bell = d.sos.length + d.submitted + d.newReports + d.toApprove;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CREAM }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                {displayName}
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

            <Pressable onPress={() => router.navigate("/notifications")} hitSlop={10}>
              <Ionicons name="notifications" size={24} color="#C9A870" />
              {unread > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    paddingHorizontal: 3,
                    backgroundColor: "#D92D20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10, fontFamily: "REM_BOLD" }}>
                    {unread > 9 ? "9+" : unread}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 22 }}>
        {dash.offline && (
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

        {d.sos.length > 0 && (
          <View style={{ backgroundColor: "#FFE3DF", borderRadius: 24, padding: 14, gap: 10, borderWidth: 2, borderColor: RED }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="warning" size={20} color="#fff" />
              </View>
              <Text style={{ flex: 1, color: "#7A1F00", fontSize: 15, fontFamily: "REM_BOLD" }}>
                {d.sos.length} active SOS {d.sos.length === 1 ? "alert" : "alerts"}
              </Text>
              <Pressable onPress={() => go("/sos-alerts")} hitSlop={8}>
                <Text style={{ color: "#7A1F00", fontSize: 12, fontFamily: "REM_BOLD" }}>View all</Text>
              </Pressable>
            </View>

            {d.sos.slice(0, 3).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => go("/sos-alerts")}
                style={{ backgroundColor: "#fff", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
                    {a.type} · {a.resident_name ?? "Unknown resident"}
                  </Text>
                  <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                    {a.location || "Location not shared"} · {timeAgo(a.created_at, now)}
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
            {stats.map((s) => (
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
            {d.activity.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 12, textAlign: "center", paddingVertical: 20, fontFamily: "REM_REGULAR" }}>
                Nothing yet. New requests, reports and sign-ups will show up here.
              </Text>
            ) : (
              d.activity.map((a, i) => (
                <View
                  key={a.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: i === d.activity.length - 1 ? 0 : 1,
                    borderBottomColor: "#F5E6BE",
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={a.icon} size={18} color={INK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>{a.text}</Text>
                    <Text style={{ color: MUTED, fontSize: 11, marginTop: 1, fontFamily: "REM_REGULAR" }}>
                      {timeAgo(a.at, now)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}