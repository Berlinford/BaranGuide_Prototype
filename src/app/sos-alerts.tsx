import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Status = "Active" | "Responding" | "Resolved";

type Sos = {
  id: string;
  ref: string;
  type: string;
  resident_name: string | null;
  contact: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
  status: Status;
  responder: string | null;
  created_at: string;
};

const TABS = ["Active", "Resolved"] as const;
type Tab = (typeof TABS)[number];

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Medical: "medkit-outline",
  Fire: "flame-outline",
  Crime: "shield-outline",
  Disaster: "water-outline",
  Other: "alert-circle-outline",
};

function ago(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr ago`;
  return `${Math.floor(mins / 1440)} day ago`;
}

export default function SosAlerts() {
  const [tab, setTab] = useState<Tab>("Active");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setTick] = useState(0); // re-renders so "2 min ago" stays current

  const { data, loading, offline, refresh } = useCached<Sos[]>("sos-alerts", async () => {
    const { data, error } = await supabase
      .from("sos_alerts")
      .select("id, ref, type, resident_name, contact, address, lat, lng, note, status, responder, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as Sos[];
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // live updates + a backup refresh every 20 seconds
  useEffect(() => {
    const channel = supabase
      .channel("sos-alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => refresh())
      .subscribe();
    const poll = setInterval(() => {
      refresh();
      setTick((t) => t + 1);
    }, 20000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const items = data ?? [];
  const live = items.filter((i) => i.status !== "Resolved");
  const counts: Record<Tab, number> = { Active: live.length, Resolved: items.length - live.length };

  const shown =
    tab === "Active"
      ? [...live].sort((a, b) =>
          a.status === b.status
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() // longest waiting first
            : a.status === "Active"
            ? -1
            : 1
        )
      : items.filter((i) => i.status === "Resolved");

  const setStatus = async (id: string | number, status: "Responding" | "Resolved") => {
    setBusyId(String(id));
    const { error } = await supabase.rpc("set_sos_status", {
      target: String(id),
      new_status: status,
    });
    setBusyId(null);

    if (error) {
      Alert.alert("Couldn't update", error.message);
      return;
    }

    refresh();
  };

  const openMap = (s: Sos) => {
    const query =
      s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : encodeURIComponent(s.address ?? "");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() =>
      Alert.alert("Can't open maps")
    );
  };

  const resolve = (s: Sos) =>
    Alert.alert("Mark as resolved?", `Close ${s.ref} for ${s.resident_name ?? "this resident"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Resolve", onPress: () => setStatus(s.id, "Resolved") },
    ]);

  return (
    <Page title="SOS Alerts" variant="official" refreshing={refreshing} onRefresh={onRefresh}>
      <FilterTabs options={TABS} value={tab} onChange={setTab} counts={counts} />

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
          Couldn't reach the server. New alerts won't appear until you're back online.
        </Text>
      )}

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title={tab === "Active" ? "No active alerts" : "Nothing resolved yet"}
          sub={tab === "Active" ? "New SOS alerts will show up here right away." : undefined}
        />
      ) : (
        shown.map((s) => {
          const urgent = s.status === "Active";
          const busy = busyId === s.id;
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
                    {s.type} · {s.resident_name ?? "Unknown resident"}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {s.ref} · {ago(s.created_at)}
                  </Text>
                </View>
                <StatusChip status={s.status} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={14} color={MUTED} />
                <Text style={{ flex: 1, color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                  {s.address || (s.lat != null ? "GPS location only. Tap Navigate." : "No location sent")}
                </Text>
              </View>

              {s.note ? (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Ionicons name="chatbox-ellipses-outline" size={14} color={MUTED} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, color: INK, fontSize: 12, fontFamily: "REM_REGULAR" }}>{s.note}</Text>
                </View>
              ) : null}

              {s.responder && <Chip label={`Responder: ${s.responder}`} bg="#FFF1C2" text="#6B4A00" />}

              {s.status !== "Resolved" && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {s.contact ? (
                    <ActionButton label="Call" icon="call-outline" tone="dark" onPress={() => Linking.openURL(`tel:${s.contact}`)} />
                  ) : null}
                  {(s.lat != null || s.address) && (
                    <ActionButton label="Navigate" icon="navigate-outline" tone="ghost" onPress={() => openMap(s)} />
                  )}
                  {s.status === "Active" ? (
                    <ActionButton
                      label="I'm responding"
                      icon="walk-outline"
                      tone="danger"
                      disabled={busy}
                      onPress={() => setStatus(s.id, "Responding")}
                    />
                  ) : (
                    <ActionButton
                      label="Mark resolved"
                      icon="checkmark-done-outline"
                      tone="success"
                      disabled={busy}
                      onPress={() => resolve(s)}
                    />
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