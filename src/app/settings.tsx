import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";
const RED = "#D92D20";

type IconName = keyof typeof Ionicons.glyphMap;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 8, marginLeft: 6 }}>{title}</Text>
      <View style={{ backgroundColor: "#fff", borderRadius: 24, paddingVertical: 4, paddingHorizontal: 14 }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  value,
  onPress,
  right,
  danger,
  last,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const color = danger ? RED : INK;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F5E6BE",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: danger ? "#FFE3DF" : "#FFD966",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color, fontSize: 14, fontFamily: "REM_BOLD" }}>{label}</Text>
        {sub ? <Text style={{ color: MUTED, fontSize: 11, marginTop: 1, fontFamily: "REM_REGULAR" }}>{sub}</Text> : null}
      </View>
      {value ? <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>{value}</Text> : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={MUTED} /> : null)}
    </Pressable>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#E5D3A8", true: "#FF9A4D" }}
      thumbColor="#fff"
    />
  );
}

const TEXT_SIZES = ["Small", "Medium", "Large"] as const;
const LANGUAGES = ["English", "Filipino"] as const;

export default function Settings() {
  const router = useRouter();
  const { role, signOut } = useAuth();  
  // TODO: persist these (AsyncStorage or your backend) so they survive app restarts
  const [pushOn, setPushOn] = useState(true);
  const [requestUpdates, setRequestUpdates] = useState(true);
  const [incidentUpdates, setIncidentUpdates] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [appLock, setAppLock] = useState(false);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("English");
  const [textSize, setTextSize] = useState<(typeof TEXT_SIZES)[number]>("Medium");

  const soon = (what: string) => Alert.alert("Sir, di pa po tapos...");

  const pickLanguage = () =>
    Alert.alert("Language", "Choose your language", [
      ...LANGUAGES.map((l) => ({ text: l, onPress: () => setLanguage(l) })),
      { text: "Cancel", style: "cancel" as const },
    ]);

  const openAppSettings = () => Linking.openSettings().catch(() => Alert.alert("Can't open settings"));

  const logout = () =>
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);

  const goHome = () =>
    router.navigate((role === "official" ? "/official-home" : "/") as any);

  const deleteAccount = () =>
    Alert.alert(
      "Delete account",
      "This permanently removes your account and cannot be undone. Your past reports may still be kept by the barangay for their records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            signOut();
          },
        },
      ]
    );

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
            <Pressable onPress={goHome} hitSlop={12} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={28} color={INK} />
            </Pressable>
            <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Settings</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
        {/* Notifications */}
        <Section title="Notifications">
          <Row
            icon="notifications-outline"
            label="Push notifications"
            sub="Turn off to stop all alerts"
            right={<Toggle value={pushOn} onChange={setPushOn} />}
            last={!pushOn}
          />
          {pushOn && (
            <>
              <Row
                icon="document-text-outline"
                label="Document request updates"
                sub="Processing, ready for pickup"
                right={<Toggle value={requestUpdates} onChange={setRequestUpdates} />}
              />
              <Row
                icon="alert-circle-outline"
                label="Incident report updates"
                sub="Status of reports you filed"
                right={<Toggle value={incidentUpdates} onChange={setIncidentUpdates} />}
              />
              <Row
                icon="megaphone-outline"
                label="Barangay announcements"
                sub="News, events, advisories"
                right={<Toggle value={announcements} onChange={setAnnouncements} />}
                last
              />
            </>
          )}
        </Section>

        {/* Account & security */}
        <Section title="Account & security">
          <Row icon="lock-closed-outline" label="Change password" onPress={() => soon("change password")} />
          <Row
            icon="finger-print-outline"
            label="App lock"
            sub="Ask for PIN or fingerprint when opening"
            right={<Toggle value={appLock} onChange={setAppLock} />}
            last
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row icon="language-outline" label="Language" value={language} onPress={pickLanguage} />
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#FFD966",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="text-outline" size={18} color={INK} />
              </View>
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Text size</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {TEXT_SIZES.map((s) => {
                const active = textSize === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setTextSize(s)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? "#FF9A4D" : "#FFF1C7",
                    }}
                  >
                    <Text style={{ color: INK, fontSize: 12, fontFamily: active ? "REM_BOLD" : "REM_REGULAR" }}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Section>

        {/* Privacy */}
        <Section title="Privacy & permissions">
          <Row
            icon="location-outline"
            label="Location access"
            sub="Used by SOS and incident reports"
            onPress={openAppSettings}
          />
          <Row
            icon="camera-outline"
            label="Camera & photos"
            sub="Used to attach photo evidence"
            onPress={openAppSettings}
            last
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <Row icon="help-circle-outline" label="Help & FAQs" onPress={() => soon("help")} />
          <Row icon="bug-outline" label="Report a problem" onPress={() => soon("feedback")} />
          <Row icon="document-lock-outline" label="Privacy policy" onPress={() => soon("privacy policy")} />
          <Row icon="reader-outline" label="Terms of use" onPress={() => soon("terms")} last />
        </Section>

        {/* Session */}
        <Section title="Account">
          <Row icon="log-out-outline" label="Log out" onPress={logout} />
          <Row icon="trash-outline" label="Delete account" danger onPress={deleteAccount} last />
        </Section>

        <Text style={{ color: MUTED, fontSize: 11, textAlign: "center", fontFamily: "REM_REGULAR" }}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}