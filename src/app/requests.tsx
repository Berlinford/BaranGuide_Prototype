import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Submitted: { bg: "#FFF1C2", text: "#6B4A00" },
  Processing: { bg: "#FFD9A8", text: "#7A3E00" },
  Ready: { bg: "#CDEFD3", text: "#14532D" },
};

const requests = [
  { id: 1, ref: "BA-0231", type: "Barangay Clearance", date: "Oct 3, 2026", status: "Processing" },
  { id: 2, ref: "BA-0198", type: "Certificate of Residency", date: "Sep 20, 2026", status: "Ready" },
  { id: 3, ref: "BA-0152", type: "Certificate of Indigency", date: "Aug 28, 2026", status: "Ready" },
  { id: 4, ref: "BA-0101", type: "Barangay ID", date: "Aug 2, 2026", status: "Ready" },
];

function RequestRow({ r }: any) {
  const chip = STATUS_STYLE[r.status];

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 32,
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Circle on the left */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#FFD966",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="document-text-outline" size={24} color={INK} />
      </View>

      {/* Title + reference */}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
          {r.type}
        </Text>
        <Text style={{ color: "#6B4A1E", fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
          {r.ref} · {r.date}
        </Text>
      </View>

      {/* Status */}
      <View style={{ backgroundColor: chip.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
        <Text style={{ color: chip.text, fontSize: 11, fontFamily: "REM_BOLD" }}>{r.status}</Text>
      </View>
    </View>
  );
}

export default function Requests() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF1C7" }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header (same style as Home) */}
      <View
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          backgroundColor: "#FFB85C",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 1,
        }}
      >
        <LinearGradient
          colors={["#FFD966", "#FFB95A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600 }}
        />
        <LinearGradient
          colors={ORANGE}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 48,
            paddingHorizontal: 16,
            paddingBottom: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => router.navigate("/")} hitSlop={12} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={28} color={INK} />
            </Pressable>
            <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Document Requests</Text>
          </View>
        </LinearGradient>
      </View>

      {/* List */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
        {requests.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="document-text-outline" size={48} color="#8A6A3A" />
            <Text style={{ color: INK, marginTop: 8, fontFamily: "REM_BOLD" }}>No requests yet</Text>
            <Text style={{ color: "#6B4A1E", fontSize: 12, fontFamily: "REM_REGULAR" }}>
              Your document requests will appear here.
            </Text>
          </View>
        ) : (
          requests.map((r) => <RequestRow key={r.id} r={r} />)
        )}
      </View>
    </ScrollView>
  );
}