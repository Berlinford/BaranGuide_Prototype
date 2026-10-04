import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";

type Status = "Received" | "In progress" | "Resolved";
type Urgency = "Low" | "Medium" | "Urgent";

const STATUSES: Status[] = ["Received", "In progress", "Resolved"];

const STATUS_STYLE: Record<Status, { bg: string; text: string; accent: string }> = {
  Received: { bg: "#FFF1C2", text: "#6B4A00", accent: "#F5C542" },
  "In progress": { bg: "#FFD9A8", text: "#7A3E00", accent: "#FF9A4D" },
  Resolved: { bg: "#CDEFD3", text: "#14532D", accent: "#4CAF6A" },
};

const URGENCY_STYLE: Record<Urgency, { bg: string; text: string }> = {
  Low: { bg: "#CDEFD3", text: "#14532D" },
  Medium: { bg: "#FFF1C2", text: "#6B4A00" },
  Urgent: { bg: "#FFC9B8", text: "#7A1F00" },
};

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Noise Complaint": "volume-high-outline",
  "Theft / Robbery": "lock-open-outline",
  Fire: "flame-outline",
  Flooding: "water-outline",
  "Fighting / Violence": "alert-circle-outline",
  "Road / Accident": "car-outline",
  "Broken Streetlight": "bulb-outline",
  "Illegal Dumping": "trash-outline",
  Other: "ellipsis-horizontal-circle-outline",
};

// TODO: replace with data from your backend
const reports: {
  id: number;
  ref: string;
  type: string;
  urgency: Urgency;
  address: string;
  details: string;
  date: string;
  status: Status;
}[] = [
  {
    id: 1,
    ref: "IR-0042",
    type: "Broken Streetlight",
    urgency: "Medium",
    address: "Mabini St., Purok 3",
    details: "The streetlight in front of the basketball court has been out for a week. The road is very dark at night.",
    date: "Oct 3, 2026",
    status: "In progress",
  },
  {
    id: 2,
    ref: "IR-0037",
    type: "Noise Complaint",
    urgency: "Low",
    address: "Rizal Ave., Purok 1",
    details: "Loud karaoke past midnight on weekdays for the past few days.",
    date: "Sep 28, 2026",
    status: "Received",
  },
  {
    id: 3,
    ref: "IR-0029",
    type: "Flooding",
    urgency: "Urgent",
    address: "Riverside Rd., Purok 5",
    details: "Water is rising near the creek and entering the first floor of nearby houses.",
    date: "Sep 12, 2026",
    status: "Resolved",
  },
  {
    id: 4,
    ref: "IR-0018",
    type: "Illegal Dumping",
    urgency: "Low",
    address: "Corner of Bonifacio St.",
    details: "Garbage is being dumped beside the drainage canal.",
    date: "Aug 30, 2026",
    status: "Resolved",
  },
];

type Report = (typeof reports)[number];

function Progress({ status }: { status: Status }) {
  const current = STATUSES.indexOf(status);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
      {STATUSES.map((s, i) => {
        const done = i <= current;
        return (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", flex: i === STATUSES.length - 1 ? 0 : 1 }}>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: done ? STATUS_STYLE[status].accent : "#EBDDB6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text
                style={{
                  position: "absolute",
                  top: 22,
                  width: 70,
                  textAlign: i === 0 ? "left" : i === STATUSES.length - 1 ? "right" : "center",
                  left: i === 0 ? 0 : i === STATUSES.length - 1 ? undefined : -26,
                  right: i === STATUSES.length - 1 ? 0 : undefined,
                  color: done ? INK : "#A88B5C",
                  fontSize: 10,
                  fontFamily: done ? "REM_BOLD" : "REM_REGULAR",
                }}
              >
                {s}
              </Text>
            </View>
            {i < STATUSES.length - 1 && (
              <View style={{ flex: 1, height: 3, backgroundColor: i < current ? STATUS_STYLE[status].accent : "#EBDDB6" }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ReportCard({ r }: { r: Report }) {
  const [open, setOpen] = useState(false);
  const chip = STATUS_STYLE[r.status];
  const urg = URGENCY_STYLE[r.urgency];

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        overflow: "hidden",
        flexDirection: "row",
      }}
    >
      {/* Colored status stripe */}
      <View style={{ width: 8, backgroundColor: chip.accent }} />

      <View style={{ flex: 1, padding: 14, gap: 8 }}>
        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name={TYPE_ICON[r.type] ?? "alert-circle-outline"} size={22} color={INK} />
          <Text numberOfLines={1} style={{ flex: 1, color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>
            {r.type}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
        </View>

        {/* Meta */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={MUTED} />
          <Text numberOfLines={1} style={{ flex: 1, color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
            {r.address}
          </Text>
        </View>

        {/* Chips + date */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ backgroundColor: chip.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: chip.text, fontSize: 11, fontFamily: "REM_BOLD" }}>{r.status}</Text>
          </View>
          <View style={{ backgroundColor: urg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: urg.text, fontSize: 11, fontFamily: "REM_BOLD" }}>{r.urgency}</Text>
          </View>
          <Text style={{ marginLeft: "auto", color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{r.date}</Text>
        </View>

        {/* Expanded details */}
        {open && (
          <View style={{ gap: 10, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F5E6BE" }}>
            <Text style={{ color: INK, fontSize: 12, lineHeight: 18, fontFamily: "REM_REGULAR" }}>{r.details}</Text>
            <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_BOLD" }}>Ref: {r.ref}</Text>
            <View style={{ marginBottom: 20 }}>
              <Progress status={r.status} />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ReportsHistory() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | Status>("All");

  const filters: ("All" | Status)[] = ["All", ...STATUSES];
  const count = (f: "All" | Status) => (f === "All" ? reports.length : reports.filter((r) => r.status === f).length);
  const shown = filter === "All" ? reports : reports.filter((r) => r.status === filter);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF1C7" }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header (same style as Home / Requests) */}
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
            <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>My Reports</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, gap: 8 }}
      >
        {filters.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? INK : "#fff",
              }}
            >
              <Text style={{ color: active ? "#FFD966" : INK, fontSize: 12, fontFamily: "REM_BOLD" }}>{f}</Text>
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  backgroundColor: active ? "#FFD966" : "#FFF1C7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: INK, fontSize: 11, fontFamily: "REM_BOLD" }}>{count(f)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
        {shown.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#8A6A3A" />
            <Text style={{ color: INK, marginTop: 8, fontFamily: "REM_BOLD" }}>
              {filter === "All" ? "No reports yet" : `No ${filter.toLowerCase()} reports`}
            </Text>
            <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
              {filter === "All" ? "Incident reports you file will appear here." : "Try a different filter."}
            </Text>
          </View>
        ) : (
          shown.map((r) => <ReportCard key={r.id} r={r} />)
        )}
      </View>
    </ScrollView>
  );
}