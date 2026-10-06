import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import {
  ActionButton,
  EmptyState,
  FilterTabs,
  INK,
  MUTED,
  Page,
  StatusChip,
  statusStyle,
} from "../../components/ui";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Status = "Submitted" | "Processing" | "Ready";

const FILTERS = ["All", "Submitted", "Processing", "Ready"] as const;
type Filter = (typeof FILTERS)[number];

type Item = {
  id: string;
  ref: string;
  full_name: string;
  contact: string;
  address: string;
  doc_type: string;
  copies: number;
  purpose: string;
  status: Status;
  created_at: string;
};

export default function OfficialRequests() {
  const [filter, setFilter] = useState<Filter>("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, offline, refresh } = useCached<Item[]>("official-requests", async () => {
    const { data, error } = await supabase
      .from("document_requests")
      .select("id, ref, full_name, contact, address, doc_type, copies, purpose, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Item[];
  });

  // reload every time this tab is opened
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

  const setStatus = async (id: string, status: "Processing" | "Ready") => {
    if (busyId) return;
    setBusyId(id);
    const { error } = await supabase.from("document_requests").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      Alert.alert(
        "Couldn't update",
        error.code ? error.message : "You need internet to change a request's status."
      );
      return;
    }
    refresh();
  };

  const all = data ?? [];
  const shown = filter === "All" ? all : all.filter((r) => r.status === filter);
  const count = (s: Status) => all.filter((r) => r.status === s).length;
  const counts: Record<Filter, number> = {
    All: all.length,
    Submitted: count("Submitted"),
    Processing: count("Processing"),
    Ready: count("Ready"),
  };

  return (
    <Page title="Document Requests" variant="official" refreshing={refreshing} onRefresh={onRefresh}>
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
          Couldn't reach the server. Showing saved data.
        </Text>
      )}

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No requests here"
          sub={filter === "All" ? "Resident requests will appear here." : `Nothing marked ${filter}.`}
        />
      ) : (
        shown.map((r) => {
          const date = new Date(r.created_at).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const busy = busyId === r.id;

          return (
            <View
              key={r.id}
              style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", flexDirection: "row" }}
            >
              <View style={{ width: 8, backgroundColor: statusStyle(r.status).accent }} />
              <View style={{ flex: 1, padding: 14, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="document-text-outline" size={22} color={INK} />
                  <Text numberOfLines={1} style={{ flex: 1, color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>
                    {r.doc_type}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <StatusChip status={r.status} />
                  <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    {r.ref} · {date}
                  </Text>
                </View>

                <View style={{ gap: 2 }}>
                  <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>{r.full_name}</Text>
                  <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                    {r.contact} · {r.address}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                    {r.copies} {r.copies === 1 ? "copy" : "copies"} · Purpose: {r.purpose}
                  </Text>
                </View>

                {r.status !== "Ready" && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                    {r.status === "Submitted" && (
                      <ActionButton
                        label="Start processing"
                        icon="play-outline"
                        disabled={busy}
                        onPress={() => setStatus(r.id, "Processing")}
                      />
                    )}
                    <ActionButton
                      label="Mark ready"
                      icon="checkmark-done-outline"
                      tone="success"
                      disabled={busy}
                      onPress={() => setStatus(r.id, "Ready")}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </Page>
  );
}