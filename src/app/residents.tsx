import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import {
  ActionButton,
  EmptyState,
  FilterTabs,
  GOLD,
  InfoRow,
  initialsOf,
  INK,
  MUTED,
  Page,
  SearchBar,
  Sheet,
} from "../../components/ui";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";

type Resident = {
  id: string;
  full_name: string | null;
  purok: string | null;
  address: string | null;
  contact: string | null;
  birthdate: string | null;
  sex: string | null;
  civil_status: string | null;
};

const PUROKS = ["All", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"] as const;
type PurokFilter = (typeof PUROKS)[number];

// "1990-03-12" -> "Mar 12, 1990" (anything else is shown as typed)
function birthdateLabel(b: string | null) {
  if (!b) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(b)) {
    return new Date(`${b}T00:00:00`).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return b;
}

export default function Residents() {
  const [query, setQuery] = useState("");
  const [purok, setPurok] = useState<PurokFilter>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, offline, refresh } = useCached<Resident[]>("official-residents", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, purok, address, contact, birthdate, sex, civil_status")
      .eq("role", "resident")
      .eq("status", "approved")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Resident[];
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

  const residents = data ?? [];

  const q = query.trim().toLowerCase();
  const shown = residents
    .filter((r) => {
      const name = r.full_name ?? "";
      const address = r.address ?? "";
      return (purok === "All" || r.purok === purok) && `${name} ${address}`.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

  const open = residents.find((r) => r.id === openId) ?? null;
  const nameOf = (r: Resident) => r.full_name?.trim() || "Unnamed resident";

  return (
    <Page title="Resident Directory" variant="official" refreshing={refreshing} onRefresh={onRefresh}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name or address" />
      <FilterTabs options={PUROKS} value={purok} onChange={setPurok} />

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

      <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR", marginLeft: 4 }}>
        {shown.length} {shown.length === 1 ? "resident" : "residents"}
      </Text>

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : shown.length === 0 ? (
        <EmptyState icon="people-outline" title="No residents found" sub="Try a different name or purok." />
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setOpenId(r.id)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 32,
                paddingVertical: 10,
                paddingLeft: 10,
                paddingRight: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: INK,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: GOLD, fontSize: 16, fontFamily: "REM_BOLD" }}>{initialsOf(nameOf(r))}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
                  {nameOf(r)}
                </Text>
                <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                  {[r.purok, r.address].filter(Boolean).join(" · ") || "No address yet"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title={open ? nameOf(open) : ""}>
        {open && (
          <>
            <InfoRow
              icon="home-outline"
              label="Address"
              value={[open.address, open.purok].filter(Boolean).join(", ") || "—"}
            />
            <InfoRow icon="call-outline" label="Contact" value={open.contact || "—"} />
            <InfoRow icon="calendar-outline" label="Birthdate" value={birthdateLabel(open.birthdate)} />
            <InfoRow icon="male-female-outline" label="Sex" value={open.sex || "—"} />
            <InfoRow icon="heart-outline" label="Civil status" value={open.civil_status || "—"} />
            {open.contact ? (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <ActionButton
                  label="Call"
                  icon="call-outline"
                  tone="dark"
                  onPress={() => Linking.openURL(`tel:${open.contact}`)}
                />
                <ActionButton
                  label="Text"
                  icon="chatbubble-outline"
                  tone="ghost"
                  onPress={() => Linking.openURL(`sms:${open.contact}`)}
                />
              </View>
            ) : null}
          </>
        )}
      </Sheet>
    </Page>
  );
}