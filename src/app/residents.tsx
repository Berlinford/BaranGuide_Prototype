import { useState } from "react";
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

type Resident = {
  id: number;
  name: string;
  purok: string;
  address: string;
  contact: string;
  birthdate: string;
  sex: string;
  civilStatus: string;
};

const PUROKS = ["All", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"] as const;
type PurokFilter = (typeof PUROKS)[number];

// TODO: load verified residents from your backend (and page the results once the list gets long)
const RESIDENTS: Resident[] = [
  { id: 1, name: "Ana Cruz", purok: "Purok 1", address: "88 Rizal Ave.", contact: "09191234567", birthdate: "Mar 12, 1990", sex: "Female", civilStatus: "Married" },
  { id: 2, name: "Carlo Bautista", purok: "Purok 3", address: "12 Mabini St.", contact: "09181234567", birthdate: "Jul 4, 1998", sex: "Male", civilStatus: "Single" },
  { id: 3, name: "Elena Torres", purok: "Purok 1", address: "90 Rizal Ave.", contact: "09201234567", birthdate: "Nov 23, 1975", sex: "Female", civilStatus: "Widowed" },
  { id: 4, name: "Jose Garcia", purok: "Purok 2", address: "21 Luna St.", contact: "09211234567", birthdate: "Jan 9, 1985", sex: "Male", civilStatus: "Married" },
  { id: 5, name: "Lita Mendoza", purok: "Purok 4", address: "7 Bonifacio St.", contact: "09221234567", birthdate: "Sep 30, 1969", sex: "Female", civilStatus: "Married" },
  { id: 6, name: "Maria Santos", purok: "Purok 3", address: "45 Mabini St.", contact: "09171234567", birthdate: "May 18, 1993", sex: "Female", civilStatus: "Single" },
  { id: 7, name: "Pedro Reyes", purok: "Purok 5", address: "3 Riverside Rd.", contact: "09231234567", birthdate: "Dec 2, 1980", sex: "Male", civilStatus: "Married" },
  { id: 8, name: "Rosa Lim", purok: "Purok 2", address: "45 Luna St.", contact: "09241234567", birthdate: "Feb 14, 2001", sex: "Female", civilStatus: "Single" },
];

export default function Residents() {
  const [query, setQuery] = useState("");
  const [purok, setPurok] = useState<PurokFilter>("All");
  const [openId, setOpenId] = useState<number | null>(null);

  const q = query.trim().toLowerCase();
  const shown = RESIDENTS.filter(
    (r) => (purok === "All" || r.purok === purok) && `${r.name} ${r.address}`.toLowerCase().includes(q)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const open = RESIDENTS.find((r) => r.id === openId) ?? null;

  return (
    <Page title="Resident Directory" variant="official">
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name or address" />
      <FilterTabs options={PUROKS} value={purok} onChange={setPurok} />

      <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR", marginLeft: 4 }}>
        {shown.length} {shown.length === 1 ? "resident" : "residents"}
      </Text>

      {shown.length === 0 ? (
        <EmptyState icon="people-outline" title="No residents found" sub="Try a different name or purok." />
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setOpenId(r.id)}
              style={{ backgroundColor: "#fff", borderRadius: 32, paddingVertical: 10, paddingLeft: 10, paddingRight: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: GOLD, fontSize: 16, fontFamily: "REM_BOLD" }}>{initialsOf(r.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{r.name}</Text>
                <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                  {r.purok} · {r.address}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""}>
        {open && (
          <>
            <InfoRow icon="home-outline" label="Address" value={`${open.address}, ${open.purok}`} />
            <InfoRow icon="call-outline" label="Contact" value={open.contact} />
            <InfoRow icon="calendar-outline" label="Birthdate" value={open.birthdate} />
            <InfoRow icon="male-female-outline" label="Sex" value={open.sex} />
            <InfoRow icon="heart-outline" label="Civil status" value={open.civilStatus} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <ActionButton label="Call" icon="call-outline" tone="dark" onPress={() => Linking.openURL(`tel:${open.contact}`)} />
              <ActionButton label="Text" icon="chatbubble-outline" tone="ghost" onPress={() => Linking.openURL(`sms:${open.contact}`)} />
            </View>
          </>
        )}
      </Sheet>
    </Page>
  );
}