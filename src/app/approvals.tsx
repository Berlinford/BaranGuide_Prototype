import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import {
    ActionButton,
    Card,
    EmptyState,
    FilterTabs,
    GOLD,
    InfoRow,
    initialsOf,
    INK,
    MUTED,
    Page,
    Sheet,
} from "../../components/ui";

type Account = {
  id: number;
  name: string;
  role: "resident" | "official";
  contact: string;
  email: string;
  address?: string;
  position?: string;
  officialId?: string;
  submitted: string;
  idPhoto?: string; // uri of the uploaded ID
};

const TABS = ["Residents", "Officials"] as const;
type Tab = (typeof TABS)[number];

// Android shows at most 3 alert buttons, so: 2 reasons + Cancel
const REASONS = ["ID doesn't match details", "Not a resident"];

// TODO: use the logged-in official's real position
const MY_POSITION = "Kagawad";
// Only the Punong Barangay may approve other officials. Enforce this on the server too.
const CAN_APPROVE_OFFICIALS = MY_POSITION === "Kagawad" || MY_POSITION === "Punong Barangay";

// TODO: replace with pending accounts from your backend
const INITIAL: Account[] = [
  { id: 1, name: "Rosa Lim", role: "resident", contact: "09171234567", email: "rosa@email.com", address: "45 Luna St., Purok 2", submitted: "Today" },
  { id: 2, name: "Carlo Bautista", role: "resident", contact: "09181234567", email: "carlo@email.com", address: "12 Mabini St., Purok 3", submitted: "Yesterday" },
  { id: 3, name: "Elena Torres", role: "resident", contact: "09191234567", email: "elena@email.com", address: "88 Rizal Ave., Purok 1", submitted: "Oct 1" },
  { id: 4, name: "Ramon Villanueva", role: "official", contact: "09201234567", email: "ramon@email.com", position: "Tanod", officialId: "BRGY-OFF-0031", submitted: "Today" },
];

export default function Approvals() {
  const [items, setItems] = useState<Account[]>(INITIAL);
  const [tab, setTab] = useState<Tab>("Residents");
  const [viewId, setViewId] = useState<number | null>(null);

  const role = tab === "Residents" ? "resident" : "official";
  const shown = items.filter((i) => i.role === role);
  const counts: Record<Tab, number> = {
    Residents: items.filter((i) => i.role === "resident").length,
    Officials: items.filter((i) => i.role === "official").length,
  };
  const viewing = items.find((i) => i.id === viewId) ?? null;
  const blocked = tab === "Officials" && !CAN_APPROVE_OFFICIALS;

  const remove = (id: number) => setItems((l) => l.filter((i) => i.id !== id));

  const approve = (a: Account) =>
    Alert.alert("Approve account?", `${a.name} will be able to log in.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => {
          // TODO: tell your backend to activate this account
          remove(a.id);
          setViewId(null);
        },
      },
    ]);

  const reject = (a: Account) =>
    Alert.alert("Reject account", "Choose a reason. The person will be told.", [
      ...REASONS.map((reason) => ({
        text: reason,
        onPress: () => {
          // TODO: tell your backend to reject with `reason`
          remove(a.id);
          setViewId(null);
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);

  return (
    <Page title="Account Approvals" variant="official">
      <FilterTabs options={TABS} value={tab} onChange={setTab} counts={counts} />

      {blocked && (
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#FFD9A8", borderRadius: 20, padding: 12, alignItems: "center" }}>
          <Ionicons name="lock-closed-outline" size={20} color="#7A3E00" />
          <Text style={{ flex: 1, color: "#7A3E00", fontSize: 12, fontFamily: "REM_REGULAR" }}>
            Only the Punong Barangay can approve official accounts. You can review them here, but not approve or reject.
          </Text>
        </View>
      )}

      {shown.length === 0 ? (
        <EmptyState icon="people-outline" title="Nothing waiting for approval" sub="New sign-ups will appear here." />
      ) : (
        shown.map((a) => (
          <Card key={a.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: GOLD, fontSize: 16, fontFamily: "REM_BOLD" }}>{initialsOf(a.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>{a.name}</Text>
                <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                  {a.role === "official" ? `${a.position} · ${a.officialId}` : a.address}
                </Text>
              </View>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{a.submitted}</Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <ActionButton label="View ID" icon="id-card-outline" tone="ghost" onPress={() => setViewId(a.id)} />
              <ActionButton label="Approve" icon="checkmark-outline" tone="success" disabled={blocked} onPress={() => approve(a)} />
              <ActionButton label="Reject" icon="close-outline" tone="danger" disabled={blocked} onPress={() => reject(a)} />
            </View>
          </Card>
        ))
      )}

      <Sheet visible={!!viewing} onClose={() => setViewId(null)} title={viewing?.name ?? ""}>
        {viewing && (
          <>
            {viewing.idPhoto ? (
              <Image source={{ uri: viewing.idPhoto }} style={{ width: "100%", height: 200, borderRadius: 20 }} resizeMode="contain" />
            ) : (
              <View style={{ height: 160, borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: "#C9A870", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Ionicons name="image-outline" size={36} color="#8A6A3A" />
                <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>Uploaded ID photo shows here</Text>
              </View>
            )}
            <InfoRow icon="call-outline" label="Contact" value={viewing.contact} />
            <InfoRow icon="mail-outline" label="Email" value={viewing.email} />
            {viewing.role === "resident" ? (
              <InfoRow icon="home-outline" label="Address" value={viewing.address ?? ""} />
            ) : (
              <>
                <InfoRow icon="briefcase-outline" label="Position" value={viewing.position ?? ""} />
                <InfoRow icon="id-card-outline" label="Official ID" value={viewing.officialId ?? ""} />
              </>
            )}
            <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
              Compare the name and address on the ID with the details above before approving.
            </Text>
          </>
        )}
      </Sheet>
    </Page>
  );
}