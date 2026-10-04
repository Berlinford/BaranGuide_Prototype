import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
    ActionButton,
    EmptyState,
    FilterTabs,
    GOLD,
    InfoRow,
    INK,
    MUTED,
    Page,
    SearchBar,
    Sheet,
    StatusChip,
} from "../../components/ui";

type Status = "Submitted" | "Processing" | "Ready" | "Rejected";

type Req = {
  id: number;
  ref: string;
  type: string;
  resident: string;
  contact: string;
  purpose: string;
  date: string;
  status: Status;
  note?: string;
};

const FILTERS = ["All", "Submitted", "Processing", "Ready", "Rejected"] as const;
type Filter = (typeof FILTERS)[number];

// Android shows at most 3 alert buttons, so: 2 reasons + Cancel
const REASONS = ["Incomplete requirements", "Not a resident"];

// TODO: replace with data from your backend
const INITIAL: Req[] = [
  { id: 1, ref: "BA-0231", type: "Barangay Clearance", resident: "Maria Santos", contact: "09171234567", purpose: "Employment requirement", date: "Oct 3, 2026", status: "Submitted" },
  { id: 2, ref: "BA-0230", type: "Certificate of Residency", resident: "Pedro Reyes", contact: "09181234567", purpose: "School enrollment", date: "Oct 3, 2026", status: "Processing" },
  { id: 3, ref: "BA-0226", type: "Certificate of Indigency", resident: "Ana Cruz", contact: "09191234567", purpose: "Medical assistance", date: "Oct 2, 2026", status: "Submitted" },
  { id: 4, ref: "BA-0221", type: "Barangay ID", resident: "Jose Garcia", contact: "09201234567", purpose: "Valid ID", date: "Oct 1, 2026", status: "Ready" },
  { id: 5, ref: "BA-0214", type: "Business Clearance", resident: "Lita Mendoza", contact: "09211234567", purpose: "Small store permit", date: "Sep 30, 2026", status: "Processing" },
  { id: 6, ref: "BA-0209", type: "Barangay Clearance", resident: "Rosa Lim", contact: "09221234567", purpose: "Travel", date: "Sep 29, 2026", status: "Rejected", note: "Incomplete requirements" },
];

export default function OfficialRequests() {
  const [items, setItems] = useState<Req[]>(INITIAL);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const open = items.find((i) => i.id === openId) ?? null;
  const count = (s: Status) => items.filter((i) => i.status === s).length;
  const counts: Record<Filter, number> = {
    All: items.length,
    Submitted: count("Submitted"),
    Processing: count("Processing"),
    Ready: count("Ready"),
    Rejected: count("Rejected"),
  };

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (filter === "All" || i.status === filter) &&
      `${i.resident} ${i.ref} ${i.type}`.toLowerCase().includes(q)
  );

  const update = (id: number, patch: Partial<Req>) =>
    setItems((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const reject = (id: number) =>
    Alert.alert("Reject request", "Choose a reason. The resident will see it.", [
      ...REASONS.map((reason) => ({
        text: reason,
        onPress: () => update(id, { status: "Rejected", note: reason }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);

  return (
    <Page title="Document Requests" variant="official">
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search name, reference or document" />
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />

      {shown.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No requests found" sub="Try a different filter or search." />
      ) : (
        <View style={{ gap: 12 }}>
          {shown.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setOpenId(r.id)}
              style={{ backgroundColor: "#fff", borderRadius: 32, paddingVertical: 10, paddingLeft: 10, paddingRight: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="document-text-outline" size={24} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{r.type}</Text>
                <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                  {r.resident} · {r.ref}
                </Text>
              </View>
              <StatusChip status={r.status} />
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title={open?.type ?? ""}>
        {open && (
          <>
            <View style={{ flexDirection: "row" }}>
              <StatusChip status={open.status} />
            </View>
            <InfoRow icon="person-outline" label="Resident" value={open.resident} />
            <InfoRow icon="call-outline" label="Contact" value={open.contact} />
            <InfoRow icon="reader-outline" label="Purpose" value={open.purpose} />
            <InfoRow icon="calendar-outline" label="Requested" value={open.date} />
            <InfoRow icon="pricetag-outline" label="Reference" value={open.ref} />
            {open.status === "Rejected" && open.note ? (
              <InfoRow icon="close-circle-outline" label="Reason for rejection" value={open.note} />
            ) : null}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
              {open.status === "Submitted" && (
                <ActionButton label="Start processing" icon="play-outline" onPress={() => update(open.id, { status: "Processing" })} />
              )}
              {open.status === "Processing" && (
                <ActionButton label="Mark as ready" icon="checkmark-done-outline" tone="success" onPress={() => update(open.id, { status: "Ready" })} />
              )}
              {(open.status === "Submitted" || open.status === "Processing") && (
                <ActionButton label="Reject" icon="close-outline" tone="danger" onPress={() => reject(open.id)} />
              )}
              {open.status === "Ready" && (
                <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                  This document is ready for pickup. The resident can see this status.
                </Text>
              )}
              {open.status === "Rejected" && (
                <ActionButton label="Reopen" icon="refresh-outline" tone="ghost" onPress={() => update(open.id, { status: "Submitted", note: undefined })} />
              )}
            </View>
          </>
        )}
      </Sheet>
    </Page>
  );
}