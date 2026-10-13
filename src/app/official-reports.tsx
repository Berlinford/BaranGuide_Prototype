import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  ActionButton,
  Chip,
  EmptyState,
  FilterTabs,
  INCIDENT_ICONS,
  INK,
  MUTED,
  Page,
  PLACEHOLDER,
  StatusChip,
  statusStyle,
  URGENCY_COLORS,
} from "../../components/ui";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Status = "Received" | "In progress" | "Resolved";
type Urgency = "Low" | "Medium" | "Urgent";

type Report = {
  id: string;
  ref: string;
  type: string;
  urgency: Urgency;
  address: string;
  details: string;
  reporter_name: string | null; // null = anonymous
  contact: string | null;
  status: Status;
  note: string; // response note the resident can see
  created_at: string;
  incident_date: string;
  incident_time: string;
  landmark: string;
  involved: string;
  photo_paths: string[];
};

const FILTERS = ["All", "Received", "In progress", "Resolved"] as const;
type Filter = (typeof FILTERS)[number];
const URGENCY_ORDER: Record<Urgency, number> = { Urgent: 0, Medium: 1, Low: 2 };

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={14} color={MUTED} />
      <Text style={{ flex: 1, color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{text}</Text>
    </View>
  );
}

// photos are in a private bucket, so each one needs a temporary signed link
function PhotoStrip({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.storage.from("incident-photos").createSignedUrls(paths, 3600);
      if (!cancelled && data) {
        setUrls(data.map((d) => d.signedUrl).filter(Boolean) as string[]);
      }
    }
    if (paths.length > 0) load();
    return () => {
      cancelled = true;
    };
  }, [paths.join(",")]);

  if (urls.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {urls.map((u) => (
        <Image
          key={u}
          source={{ uri: u }}
          style={{ width: 92, height: 92, borderRadius: 16, backgroundColor: "#FFE0B0" }}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

export default function OfficialReports() {
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // notes being typed
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, offline, refresh } = useCached<Report[]>("official-reports", async () => {
    const { data, error } = await supabase
      .from("incident_reports")
      .select(
        "id, ref, type, urgency, address, details, reporter_name, contact, status, note, created_at, incident_date, incident_time, landmark, involved, photo_paths"
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Report[];
  });

  // live updates: a new report from a resident shows up right away
  useEffect(() => {
    const channel = supabase
      .channel("official-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

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

  const items = data ?? [];
  const count = (s: Status) => items.filter((i) => i.status === s).length;
  const counts: Record<Filter, number> = {
    All: items.length,
    Received: count("Received"),
    "In progress": count("In progress"),
    Resolved: count("Resolved"),
  };

  const shown = items
    .filter((i) => filter === "All" || i.status === filter)
    .sort(
      (a, b) =>
        URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // saves the note, and the new status when one is given
  async function save(r: Report, status?: Status) {
    const patch: { note: string; status?: Status } = { note: (drafts[r.id] ?? r.note).trim() };
    if (status) patch.status = status;

    setBusyId(r.id);
    const { data: rows, error } = await supabase
      .from("incident_reports")
      .update(patch)
      .eq("id", r.id)
      .select("id");
    setBusyId(null);

    if (error) {
      Alert.alert("Couldn't update", error.message);
      return;
    }
    if (!rows || rows.length === 0) {
      Alert.alert("Not allowed", "Your account can't update reports.");
      return;
    }

    setDrafts((d) => {
      const next = { ...d };
      delete next[r.id];
      return next;
    });
    refresh();
  }

  return (
    <Page title="Incident Reports" variant="official" refreshing={refreshing} onRefresh={onRefresh}>
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />

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
          Couldn't reach the server. Showing saved data. Updating needs internet.
        </Text>
      )}

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title="No reports here" sub="Try a different filter." />
      ) : (
        shown.map((r) => {
          const open = openId === r.id;
          const busy = busyId === r.id;
          const accent = statusStyle(r.status).accent;
          const urg = URGENCY_COLORS[r.urgency];
          const date = new Date(r.created_at).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const whenLine = [r.incident_date, r.incident_time].filter(Boolean).join(" · ");
          const noteValue = drafts[r.id] ?? r.note;
          const dirty = drafts[r.id] !== undefined && drafts[r.id].trim() !== r.note.trim();

          return (
            <Pressable
              key={r.id}
              onPress={() => setOpenId(open ? null : r.id)}
              style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", flexDirection: "row" }}
            >
              <View style={{ width: 8, backgroundColor: accent }} />
              <View style={{ flex: 1, padding: 14, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name={INCIDENT_ICONS[r.type] ?? "alert-circle-outline"} size={22} color={INK} />
                  <Text numberOfLines={1} style={{ flex: 1, color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>
                    {r.type}
                  </Text>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="location-outline" size={13} color={MUTED} />
                  <Text numberOfLines={1} style={{ flex: 1, color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {r.address}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <StatusChip status={r.status} />
                  <Chip label={r.urgency} bg={urg.bg} text={urg.text} />
                  <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {date}
                  </Text>
                </View>

                {open && (
                  <View style={{ gap: 12, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5E6BE" }}>
                    <Text style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}>
                      {r.details}
                    </Text>

                    <View style={{ gap: 6 }}>
                      {whenLine ? <DetailRow icon="time-outline" text={whenLine} /> : null}
                      {r.landmark ? <DetailRow icon="navigate-outline" text={r.landmark} /> : null}
                      {r.involved ? <DetailRow icon="people-outline" text={`Involved: ${r.involved}`} /> : null}
                    </View>

                    {r.photo_paths.length > 0 && <PhotoStrip paths={r.photo_paths} />}

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="person-outline" size={14} color={MUTED} />
                      <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_BOLD" }}>
                        {r.reporter_name ?? "Anonymous reporter"} · {r.ref}
                      </Text>
                    </View>

                    <View>
                      <Text style={{ color: INK, fontSize: 12, fontFamily: "REM_BOLD", marginBottom: 6 }}>
                        Response note (the resident can see this)
                      </Text>
                      <TextInput
                        value={noteValue}
                        onChangeText={(t) => setDrafts((d) => ({ ...d, [r.id]: t }))}
                        placeholder="e.g. Tanod dispatched to the area"
                        placeholderTextColor={PLACEHOLDER}
                        multiline
                        textAlignVertical="top"
                        style={{
                          backgroundColor: "#FFF1C7",
                          borderRadius: 16,
                          padding: 12,
                          minHeight: 64,
                          color: INK,
                          fontSize: 13,
                          fontFamily: "REM_REGULAR",
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {r.status === "Received" && (
                        <ActionButton
                          label="Start working"
                          icon="play-outline"
                          disabled={busy}
                          onPress={() => save(r, "In progress")}
                        />
                      )}
                      {r.status === "In progress" && (
                        <ActionButton
                          label="Mark resolved"
                          icon="checkmark-done-outline"
                          tone="success"
                          disabled={busy}
                          onPress={() => save(r, "Resolved")}
                        />
                      )}
                      {r.status === "Resolved" && (
                        <ActionButton
                          label="Reopen"
                          icon="refresh-outline"
                          tone="ghost"
                          disabled={busy}
                          onPress={() => save(r, "In progress")}
                        />
                      )}
                      {dirty && (
                        <ActionButton
                          label="Save note"
                          icon="save-outline"
                          tone="ghost"
                          disabled={busy}
                          onPress={() => save(r)}
                        />
                      )}
                      {r.contact && (
                        <ActionButton
                          label="Call reporter"
                          icon="call-outline"
                          tone="dark"
                          onPress={() => Linking.openURL(`tel:${r.contact}`)}
                        />
                      )}
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </Page>
  );
}