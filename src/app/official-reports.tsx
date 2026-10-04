import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
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

type Status = "Received" | "In progress" | "Resolved";
type Urgency = "Low" | "Medium" | "Urgent";

type Report = {
  id: number;
  ref: string;
  type: string;
  urgency: Urgency;
  address: string;
  details: string;
  reporter: string | null; // null = anonymous
  contact: string | null;
  date: string;
  status: Status;
  note: string; // response note the resident can see
};

const FILTERS = ["All", "Received", "In progress", "Resolved"] as const;
type Filter = (typeof FILTERS)[number];
const URGENCY_ORDER: Record<Urgency, number> = { Urgent: 0, Medium: 1, Low: 2 };

// TODO: replace with data from your backend
const INITIAL: Report[] = [
  { id: 1, ref: "IR-0042", type: "Broken Streetlight", urgency: "Medium", address: "Mabini St., Purok 3", details: "The streetlight in front of the basketball court has been out for a week. The road is very dark at night.", reporter: "Juan Dela Cruz", contact: "09171234567", date: "Oct 3, 2026", status: "In progress", note: "Electrician scheduled this week." },
  { id: 2, ref: "IR-0041", type: "Flooding", urgency: "Urgent", address: "Riverside Rd., Purok 5", details: "Water is rising near the creek and entering the first floor of nearby houses.", reporter: "Maria Santos", contact: "09181234567", date: "Oct 3, 2026", status: "Received", note: "" },
  { id: 3, ref: "IR-0037", type: "Noise Complaint", urgency: "Low", address: "Rizal Ave., Purok 1", details: "Loud karaoke past midnight on weekdays for the past few days.", reporter: null, contact: null, date: "Sep 28, 2026", status: "Received", note: "" },
  { id: 4, ref: "IR-0029", type: "Illegal Dumping", urgency: "Low", address: "Corner of Bonifacio St.", details: "Garbage is being dumped beside the drainage canal.", reporter: "Ana Cruz", contact: "09191234567", date: "Sep 12, 2026", status: "Resolved", note: "Area cleaned and signage posted." },
];

export default function OfficialReports() {
  const [items, setItems] = useState<Report[]>(INITIAL);
  const [filter, setFilter] = useState<Filter>("All");
  const [openId, setOpenId] = useState<number | null>(null);

  const count = (s: Status) => items.filter((i) => i.status === s).length;
  const counts: Record<Filter, number> = {
    All: items.length,
    Received: count("Received"),
    "In progress": count("In progress"),
    Resolved: count("Resolved"),
  };

  const shown = items
    .filter((i) => filter === "All" || i.status === filter)
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || b.id - a.id);

  const update = (id: number, patch: Partial<Report>) =>
    setItems((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Page title="Incident Reports" variant="official">
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />

      {shown.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title="No reports here" sub="Try a different filter." />
      ) : (
        shown.map((r) => {
          const open = openId === r.id;
          const accent = statusStyle(r.status).accent;
          const urg = URGENCY_COLORS[r.urgency];
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
                  <Text numberOfLines={1} style={{ flex: 1, color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>{r.type}</Text>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="location-outline" size={13} color={MUTED} />
                  <Text numberOfLines={1} style={{ flex: 1, color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{r.address}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <StatusChip status={r.status} />
                  <Chip label={r.urgency} bg={urg.bg} text={urg.text} />
                  <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{r.date}</Text>
                </View>

                {open && (
                  <View style={{ gap: 12, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5E6BE" }}>
                    <Text style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}>{r.details}</Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="person-outline" size={14} color={MUTED} />
                      <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_BOLD" }}>
                        {r.reporter ?? "Anonymous reporter"} · {r.ref}
                      </Text>
                    </View>

                    <View>
                      <Text style={{ color: INK, fontSize: 12, fontFamily: "REM_BOLD", marginBottom: 6 }}>
                        Response note (the resident can see this)
                      </Text>
                      <TextInput
                        value={r.note}
                        onChangeText={(t) => update(r.id, { note: t })}
                        placeholder="e.g. Tanod dispatched to the area"
                        placeholderTextColor={PLACEHOLDER}
                        multiline
                        textAlignVertical="top"
                        style={{ backgroundColor: "#FFF1C7", borderRadius: 16, padding: 12, minHeight: 64, color: INK, fontSize: 13, fontFamily: "REM_REGULAR" }}
                      />
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {r.status === "Received" && (
                        <ActionButton label="Start working" icon="play-outline" onPress={() => update(r.id, { status: "In progress" })} />
                      )}
                      {r.status === "In progress" && (
                        <ActionButton label="Mark resolved" icon="checkmark-done-outline" tone="success" onPress={() => update(r.id, { status: "Resolved" })} />
                      )}
                      {r.status === "Resolved" && (
                        <ActionButton label="Reopen" icon="refresh-outline" tone="ghost" onPress={() => update(r.id, { status: "In progress" })} />
                      )}
                      {r.contact && (
                        <ActionButton label="Call reporter" icon="call-outline" tone="dark" onPress={() => Linking.openURL(`tel:${r.contact}`)} />
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