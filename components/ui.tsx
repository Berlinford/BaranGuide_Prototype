import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export const ORANGE = ["#FFD966", "#FF9A4D"] as const;
export const DARK = ["#4A2C05", "#2B1A02"] as const; // officials' header + tab bar
export const INK = "#3B2300";
export const MUTED = "#6B4A1E";
export const GOLD = "#FFD966";
export const RED = "#D92D20";
export const CREAM = "#FFF1C7";
export const PLACEHOLDER = "#A88B5C";

export type IconName = keyof typeof Ionicons.glyphMap;
export type Variant = "resident" | "official";

/* ---------- colors ---------- */

const S = (bg: string, text: string, accent: string) => ({ bg, text, accent });
const YELLOW = S("#FFF1C2", "#6B4A00", "#F5C542");
const AMBER = S("#FFD9A8", "#7A3E00", "#FF9A4D");
const GREEN = S("#CDEFD3", "#14532D", "#4CAF6A");
const REDISH = S("#FFC9B8", "#7A1F00", "#D92D20");

export const STATUS_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  Submitted: YELLOW,
  Received: YELLOW,
  Pending: YELLOW,
  Processing: AMBER,
  "In progress": AMBER,
  Responding: AMBER,
  Ready: GREEN,
  Resolved: GREEN,
  Approved: GREEN,
  Rejected: REDISH,
  Active: REDISH,
};
export const statusStyle = (s: string) => STATUS_COLORS[s] ?? YELLOW;

export const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
  Low: { bg: "#CDEFD3", text: "#14532D" },
  Medium: { bg: "#FFF1C2", text: "#6B4A00" },
  Urgent: { bg: "#FFC9B8", text: "#7A1F00" },
};

export const INCIDENT_ICONS: Record<string, IconName> = {
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

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

/* ---------- header + page ---------- */

export function ScreenHeader({
  title,
  variant = "resident",
  backTo,
  right,
}: {
  title: string;
  variant?: Variant;
  backTo?: string | null; // undefined = default, null = no back button
  right?: ReactNode;
}) {
  const router = useRouter();
  const official = variant === "official";
  const fg = official ? GOLD : INK;
  const target = backTo === undefined ? (official ? "/official-home" : "/") : backTo;

  return (
    <View
      style={{
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: official ? "#3A2304" : "#FFB85C",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 1,
      }}
    >
      <LinearGradient
        colors={official ? DARK : ["#FFD966", "#FFB95A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600 }}
      />
      <LinearGradient
        colors={official ? DARK : ORANGE}
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
          {target !== null && (
            <Pressable onPress={() => router.navigate(target as any)} hitSlop={12} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={28} color={fg} />
            </Pressable>
          )}
          <Text style={{ flex: 1, color: fg, fontSize: 20, fontFamily: "REM_BOLD" }}>{title}</Text>
          {right}
        </View>
      </LinearGradient>
    </View>
  );
}

export function Page({
  title,
  variant = "resident",
  backTo,
  right,
  children,
}: {
  title: string;
  variant?: Variant;
  backTo?: string | null;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CREAM }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={title} variant={variant} backTo={backTo} right={right} />
      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>{children}</View>
    </ScrollView>
  );
}

/* ---------- small pieces ---------- */

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  counts,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts?: Record<T, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
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
            <Text style={{ color: active ? GOLD : INK, fontSize: 12, fontFamily: "REM_BOLD" }}>{o}</Text>
            {counts ? (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  backgroundColor: active ? GOLD : CREAM,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: INK, fontSize: 11, fontFamily: "REM_BOLD" }}>{counts[o]}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 32,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Ionicons name="search-outline" size={20} color={MUTED} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        autoCorrect={false}
        style={{ flex: 1, minHeight: 48, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
      />
      {value ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={MUTED} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, sub }: { icon: IconName; title: string; sub?: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40 }}>
      <Ionicons name={icon} size={48} color="#8A6A3A" />
      <Text style={{ color: INK, marginTop: 8, fontFamily: "REM_BOLD" }}>{title}</Text>
      {sub ? <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>{sub}</Text> : null}
    </View>
  );
}

export function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: text, fontSize: 11, fontFamily: "REM_BOLD" }}>{label}</Text>
    </View>
  );
}

export function StatusChip({ status }: { status: string }) {
  const c = statusStyle(status);
  return <Chip label={status} bg={c.bg} text={c.text} />;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[{ backgroundColor: "#fff", borderRadius: 24, padding: 14 }, style]}>{children}</View>;
}

export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: GOLD,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={INK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{label}</Text>
        <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{value || "Not provided"}</Text>
      </View>
    </View>
  );
}

const TONES = {
  primary: { bg: "#FF9A4D", fg: INK, border: "transparent" },
  dark: { bg: INK, fg: GOLD, border: "transparent" },
  success: { bg: "#2E7D4F", fg: "#fff", border: "transparent" },
  danger: { bg: RED, fg: "#fff", border: "transparent" },
  ghost: { bg: "#fff", fg: INK, border: "#F5E6BE" },
} as const;

export function ActionButton({
  label,
  icon,
  onPress,
  tone = "primary",
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  tone?: keyof typeof TONES;
  disabled?: boolean;
}) {
  const t = TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 120,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 24,
        backgroundColor: t.bg,
        borderWidth: 2,
        borderColor: t.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon ? <Ionicons name={icon} size={18} color={t.fg} /> : null}
      <Text style={{ color: t.fg, fontSize: 13, fontFamily: "REM_BOLD" }}>{label}</Text>
    </Pressable>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: "85%",
            backgroundColor: "#FFF3CC",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ flex: 1, color: INK, fontSize: 18, fontFamily: "REM_BOLD" }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color={INK} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}