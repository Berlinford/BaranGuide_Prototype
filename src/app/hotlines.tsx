import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { Card, IconName, INK, MUTED, Page } from "../../components/ui";

type Hotline = { label: string; note?: string; number: string; icon: IconName };

// TODO: fill in your barangay's real numbers. Empty ones show as "Number not available".
// 911 (national emergency), 117 (PNP) and 143 (Philippine Red Cross) are national numbers.
const GROUPS: { title: string; items: Hotline[] }[] = [
  {
    title: "Emergency",
    items: [
      { label: "National emergency", note: "Police, fire, medical", number: "911", icon: "call-outline" },
      { label: "Philippine Red Cross", note: "Medical and rescue", number: "143", icon: "medkit-outline" },
      { label: "PNP hotline", note: "Police", number: "117", icon: "shield-outline" },
    ],
  },
  {
    title: "Barangay and local",
    items: [
      { label: "Barangay hall", number: "", icon: "home-outline" },
      { label: "Barangay tanod", number: "", icon: "walk-outline" },
      { label: "Municipal DRRMO", note: "Disaster response", number: "", icon: "water-outline" },
      { label: "Fire station", number: "", icon: "flame-outline" },
      { label: "Health center / RHU", number: "", icon: "medkit-outline" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { label: "Water district", number: "", icon: "water-outline" },
      { label: "Electric cooperative", number: "", icon: "flash-outline" },
    ],
  },
];

export default function Hotlines() {
  const call = (n: string) =>
    Linking.openURL(`tel:${n}`).catch(() => Alert.alert("Can't place call", "Your device couldn't open the phone app."));

  return (
    <Page title="Emergency Hotlines">
      <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#FFD9A8", borderRadius: 20, padding: 12, alignItems: "center" }}>
        <Ionicons name="warning-outline" size={20} color="#7A3E00" />
        <Text style={{ flex: 1, color: "#7A3E00", fontSize: 12, fontFamily: "REM_REGULAR" }}>
          In a life-threatening emergency, call 911 first or use the SOS button on the home screen.
        </Text>
      </View>

      {GROUPS.map((g) => (
        <View key={g.title}>
          <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 8, marginLeft: 4 }}>{g.title}</Text>
          <Card style={{ paddingVertical: 4 }}>
            {g.items.map((h, i) => {
              const has = !!h.number;
              return (
                <View
                  key={h.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: i === g.items.length - 1 ? 0 : 1,
                    borderBottomColor: "#F5E6BE",
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFD966", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={h.icon} size={20} color={INK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{h.label}</Text>
                    <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                      {has ? h.number : "Number not available"}
                      {h.note ? ` · ${h.note}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => call(h.number)}
                    disabled={!has}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: has ? "#2E7D4F" : "#E5D3A8",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </Page>
  );
}