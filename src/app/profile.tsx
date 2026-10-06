import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";
const PLACEHOLDER = "#A88B5C";

// TODO: replace with data from your backend / auth
const EMPTY = {
  photo: null as string | null,
  fullName: "",
  idNumber: "",
  birthdate: "",
  sex: "",
  civilStatus: "",
  contact: "",
  email: "",
  address: "",
  purok: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyContact: "",
};

type Profile = typeof EMPTY;

const fromRow = (r: any): Profile => ({
  photo: null,
  fullName: r.full_name ?? "",
  idNumber: r.id_number ?? "",
  birthdate: r.birthdate ?? "",
  sex: r.sex ?? "",
  civilStatus: r.civil_status ?? "",
  contact: r.contact ?? "",
  email: r.email ?? "",
  address: r.address ?? "",
  purok: r.purok ?? "",
  emergencyName: r.emergency_name ?? "",
  emergencyRelation: r.emergency_relation ?? "",
  emergencyContact: r.emergency_contact ?? "",
});

type FieldDef = {
  key: keyof Profile;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboard?: "default" | "phone-pad" | "email-address";
  readOnly?: boolean;
};

const PERSONAL: FieldDef[] = [
  { key: "fullName", label: "Full name", icon: "person-outline" },
  { key: "birthdate", label: "Birthdate", icon: "calendar-outline" },
  { key: "sex", label: "Sex", icon: "male-female-outline" },
  { key: "civilStatus", label: "Civil status", icon: "heart-outline" },
  { key: "contact", label: "Contact number", icon: "call-outline", keyboard: "phone-pad" },
  { key: "email", label: "Email", icon: "mail-outline", keyboard: "email-address", readOnly: true },];

const ADDRESS: FieldDef[] = [
  { key: "address", label: "Street / House no.", icon: "home-outline" },
  { key: "purok", label: "Purok / Zone", icon: "location-outline" },
];

const EMERGENCY: FieldDef[] = [
  { key: "emergencyName", label: "Contact name", icon: "person-outline" },
  { key: "emergencyRelation", label: "Relationship", icon: "people-outline" },
  { key: "emergencyContact", label: "Contact number", icon: "call-outline", keyboard: "phone-pad" },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 8, marginLeft: 6 }}>{title}</Text>
      <View style={{ backgroundColor: "#fff", borderRadius: 24, paddingVertical: 6, paddingHorizontal: 14 }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  def,
  value,
  editing,
  onChange,
  last,
}: {
  def: FieldDef;
  value: string;
  editing: boolean;
  onChange: (t: string) => void;
  last: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F5E6BE",
      }}
    >
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
        <Ionicons name={def.icon} size={18} color={INK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>{def.label}</Text>
        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={def.label}
            placeholderTextColor={PLACEHOLDER}
            keyboardType={def.keyboard ?? "default"}
            autoCapitalize={def.keyboard === "email-address" ? "none" : "words"}
            style={{
              color: INK,
              fontSize: 14,
              fontFamily: "REM_BOLD",
              paddingVertical: 2,
              borderBottomWidth: 1,
              borderBottomColor: "#FF9A4D",
            }}
          />
        ) : (
          <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginTop: 1 }}>
            {value || "Not set"}
          </Text>
        )}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  right,
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
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
      <Ionicons name={icon} size={22} color={danger ? "#D92D20" : INK} />
      <Text style={{ flex: 1, color: danger ? "#D92D20" : INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{label}</Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={MUTED} /> : null)}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
const { role, userId, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [draft, setDraft] = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const data = editing ? draft : profile;
  const set = (key: keyof Profile) => (t: string) => setDraft((d) => ({ ...d, [key]: t }));

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) return console.log("Profile load error:", error);
      const p = fromRow(data);
      setProfile(p);
      setDraft(p);
    })();
  }, [userId]);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const save = async () => {
    if (!draft.fullName.trim()) return Alert.alert("Missing info", "Full name can't be empty.");
    if (!draft.contact.trim()) return Alert.alert("Missing info", "Enter your contact number.");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: draft.fullName.trim(),
        contact: draft.contact.trim(),
        birthdate: draft.birthdate,
        sex: draft.sex,
        civil_status: draft.civilStatus,
        address: draft.address,
        purok: draft.purok,
        emergency_name: draft.emergencyName,
        emergency_relation: draft.emergencyRelation,
        emergency_contact: draft.emergencyContact,
      })
      .eq("id", userId!);

    if (error) return Alert.alert("Couldn't save", error.message);
    setProfile(draft);
    setEditing(false);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to change your picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setProfile((p) => ({ ...p, photo: uri }));
      setDraft((d) => ({ ...d, photo: uri }));
    }
  };

  const logout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          // TODO: clear session / token
          router.navigate("/");
        },
      },
    ]);
  };

  const initials = data.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const renderRows = (defs: FieldDef[]) =>
    defs.map((def, i) => (
      <Row
        key={def.key}
        def={def}
        value={data[def.key] as string}
        editing={editing}
        onChange={set(def.key)}
        last={i === defs.length - 1}
      />
    ));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF1C7" }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
            <Pressable
              onPress={() => router.navigate((role === "official" ? "/official-home" : "/") as any)}
              hitSlop={12}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={INK} />
            </Pressable>
            <Text style={{ flex: 1, color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Profile</Text>
            {!editing && (
              <Pressable onPress={startEdit} hitSlop={12} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="create-outline" size={20} color={INK} />
                <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Edit</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
        {/* Avatar + name */}
        <View style={{ alignItems: "center", gap: 6 }}>
          <Pressable onPress={pickPhoto}>
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: "#FFD966",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: 4,
                borderColor: "#fff",
              }}
            >
              {profile.photo ? (
                <Image source={{ uri: profile.photo }} style={{ width: 104, height: 104 }} />
              ) : (
                <Text style={{ color: INK, fontSize: 36, fontFamily: "REM_BOLD" }}>{initials || "?"}</Text>
              )}
            </View>
            <View
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: INK,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#FFF1C7",
              }}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>

          <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD", marginTop: 4 }}>{data.fullName || "Your name"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>{profile.idNumber || "ID pending"}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#CDEFD3",
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Ionicons name="checkmark-circle" size={12} color="#14532D" />
              <Text style={{ color: "#14532D", fontSize: 11, fontFamily: "REM_BOLD" }}>Verified</Text>
            </View>
          </View>
        </View>

        <Card title="Personal information">{renderRows(PERSONAL)}</Card>
        <Card title="Home address">{renderRows(ADDRESS)}</Card>
        <Card title="Emergency contact">{renderRows(EMERGENCY)}</Card>

        {/* Save / cancel while editing */}
        {editing && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={cancelEdit}
              style={{ flex: 1, backgroundColor: "#fff", borderRadius: 32, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} style={{ flex: 1, borderRadius: 32, overflow: "hidden" }}>
              <LinearGradient
                colors={ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 15, alignItems: "center" }}
              >
                <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>Save changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Settings */}
        {!editing && (
          <>
            <Card title="Settings">
              <SettingRow
                icon="notifications-outline"
                label="Notifications"
                right={
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: "#E5D3A8", true: "#FF9A4D" }}
                    thumbColor="#fff"
                  />
                }
              />
              <SettingRow
                icon="lock-closed-outline"
                label="Change password"
                onPress={() => Alert.alert("Sir, di pa po tapos")}
              />
              <SettingRow
                icon="help-circle-outline"
                label="Help & support"
                onPress={() => Alert.alert("Sir, di pa po tapos")}
              />
              <SettingRow icon="log-out-outline" 
                label="Log out" 
                onPress={logout} danger last />
              
            </Card>

            <Text style={{ color: MUTED, fontSize: 11, textAlign: "center", fontFamily: "REM_REGULAR" }}>
              Version 1.0.0
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}