import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import {
    ActionButton,
    Card,
    Chip,
    EmptyState,
    FilterTabs,
    INK,
    MUTED,
    Page,
    RED,
    StatusChip,
} from "../../components/ui";

type Status = "Active" | "Responding" | "Resolved";

type Sos = {
  id: number;
  ref: string;
  type: string;
  resident: string;
  contact: string;
  address: string;
  lat?: number;
  lng?: number;
  minsAgo: number;
  status: Status;
  responder?: string;
};

const TABS = ["Active", "Resolved"] as const;
type Tab = (typeof TABS)[number];

// TODO: replace with live data from your backend (and subscribe to updates so new alerts appear instantly)
const INITIAL: Sos[] = [
  { id: 1, ref: "SOS-4821", type: "Medical", resident: "Maria Santos", contact: "09171234567", address: "Mabini St., Purok 3", lat: 14.1275, lng: 121.4372, minsAgo: 2, status: "Active" },
  { id: 2, ref: "SOS-4819", type: "Fire", resident: "Pedro Reyes", contact: "09181234567", address: "Rizal Ave., Purok 1", minsAgo: 11, status: "Responding", responder: "Kgwd. Reyes" },
  { id: 3, ref: "SOS-4790", type: "Crime", resident: "Ana Cruz", contact: "09191234567", address: "Bonifacio St., Purok 2", minsAgo: 1440, status: "Resolved", responder: "Tanod Dela Rosa" },
];

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Medical: "medkit-outline",
  Fire: "flame-outline",
  Crime: "shield-outline",
  Disaster: "water-outline",
  Other: "alert-circle-outline",
};

// TODO: use the logged-in official's real name/position
const ME = "You";

function ago(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr ago`;
  return `${Math.floor(mins / 1440)} day ago`;
}

export default function SosAlerts() {
  const [items, setItems] = useState<Sos[]>(INITIAL);
  const [tab, setTab] = useState<Tab>("Active");

  const live = items.filter((i) => i.status !== "Resolved");
  const counts: Record<Tab, number> = { Active: live.length, Resolved: items.length - live.length };

  const shown =
    tab === "Active"
      ? [...live].sort((a, b) => (a.status === b.status ? b.minsAgo - a.minsAgo : a.status === "Active" ? -1 : 1))
      : items.filter((i) => i.status === "Resolved");

  const update = (id: number, patch: Partial<Sos>) =>
    setItems((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const openMap = (s: Sos) => {
    const query = s.lat && s.lng ? `${s.lat},${s.lng}` : encodeURIComponent(s.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() =>
      Alert.alert("Can't open maps")
    );
  };

  const resolve = (s: Sos) =>
    Alert.alert("Mark as resolved?", `Close ${s.ref} for ${s.resident}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Resolve", onPress: () => update(s.id, { status: "Resolved", responder: s.responder ?? ME }) },
    ]);

  return (
    <Page title="SOS Alerts" variant="official">
      <FilterTabs options={TABS} value={tab} onChange={setTab} counts={counts} />

      {shown.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title={tab === "Active" ? "No active alerts" : "Nothing resolved yet"}
          sub={tab === "Active" ? "New SOS alerts will show up here right away." : undefined}
        />
      ) : (
        shown.map((s) => {
          const urgent = s.status === "Active";
          return (
            <Card key={s.id} style={{ gap: 10, borderWidth: urgent ? 2 : 0, borderColor: RED }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: urgent ? RED : "#FFD9A8",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={TYPE_ICON[s.type] ?? "alert-circle-outline"} size={22} color={urgent ? "#fff" : INK} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>
                    {s.type} · {s.resident}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {s.ref} · {ago(s.minsAgo)}
                  </Text>
                </View>
                <StatusChip status={s.status} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={14} color={MUTED} />
                <Text style={{ flex: 1, color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>{s.address}</Text>
              </View>

              {s.responder && (
                <Chip label={`Responder: ${s.responder}`} bg="#FFF1C2" text="#6B4A00" />
              )}

              {s.status !== "Resolved" && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <ActionButton label="Call" icon="call-outline" tone="dark" onPress={() => Linking.openURL(`tel:${s.contact}`)} />
                  <ActionButton label="Navigate" icon="navigate-outline" tone="ghost" onPress={() => openMap(s)} />
                  {s.status === "Active" ? (
                    <ActionButton label="I'm responding" icon="walk-outline" tone="danger" onPress={() => update(s.id, { status: "Responding", responder: ME })} />
                  ) : (
                    <ActionButton label="Mark resolved" icon="checkmark-done-outline" tone="success" onPress={() => resolve(s)} />
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}
    </Page>
  );
}