import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, Text, TextInput, View } from "react-native";
import { GOLD, INK, MUTED, ORANGE, Page, PLACEHOLDER } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useCached } from "../../lib/offline";
import { avatarUrl, uploadImage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

const EMPTY = {
  photoPath: null as string | null,
  status: "",
  fullName: "",
  position: "",
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
  photoPath: r.photo_path ?? null,
  status: r.status ?? "",
  fullName: r.full_name ?? "",
  position: r.position ?? "",
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

const PERSONAL_RESIDENT: FieldDef[] = [
  { key: "fullName", label: "Full name", icon: "person-outline" },
  { key: "birthdate", label: "Birthdate", icon: "calendar-outline" },
  { key: "sex", label: "Sex", icon: "male-female-outline" },
  { key: "civilStatus", label: "Civil status", icon: "heart-outline" },
  { key: "contact", label: "Contact number", icon: "call-outline", keyboard: "phone-pad" },
  { key: "email", label: "Email", icon: "mail-outline", keyboard: "email-address", readOnly: true },
];

const PERSONAL_OFFICIAL: FieldDef[] = [
  { key: "fullName", label: "Full name", icon: "person-outline" },
  { key: "position", label: "Position", icon: "ribbon-outline", readOnly: true },
  { key: "idNumber", label: "Official ID number", icon: "id-card-outline", readOnly: true },
  { key: "contact", label: "Contact number", icon: "call-outline", keyboard: "phone-pad" },
  { key: "email", label: "Email", icon: "mail-outline", keyboard: "email-address", readOnly: true },
];

const ADDRESS: FieldDef[] = [
  { key: "address", label: "Street / House no.", icon: "home-outline" },
  { key: "purok", label: "Purok / Zone", icon: "location-outline" },
];

const EMERGENCY: FieldDef[] = [
  { key: "emergencyName", label: "Contact name", icon: "person-outline" },
  { key: "emergencyRelation", label: "Relationship", icon: "people-outline" },
  { key: "emergencyContact", label: "Contact number", icon: "call-outline", keyboard: "phone-pad" },
];

const needsInternet = (e: { code?: string; message: string }) =>
  e.code ? e.message : "You need internet to do this. Try again once you're online.";

/* ---------- small pieces ---------- */

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
        {editing && !def.readOnly ? (
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
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
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
      <Ionicons name="chevron-forward" size={18} color={MUTED} />
    </Pressable>
  );
}

function PasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setPw("");
    setConfirm("");
    setShow(false);
    onClose();
  };

  const save = async () => {
    if (saving) return;
    if (pw.length < 8) return Alert.alert("Password too short", "Use at least 8 characters.");
    if (pw !== confirm) return Alert.alert("Passwords don't match", "Type the same password twice.");

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);

    if (error) return Alert.alert("Couldn't change password", needsInternet(error));
    Alert.alert("Password changed", "Use your new password next time you log in.");
    close();
  };

  const field = {
    backgroundColor: "#FFF1C7",
    borderRadius: 28,
    paddingHorizontal: 16,
    minHeight: 48,
    color: INK,
    fontSize: 14,
    fontFamily: "REM_REGULAR",
  } as const;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: "rgba(59,35,0,0.45)", justifyContent: "center", paddingHorizontal: 24 }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} />
        <View style={{ backgroundColor: "#FFF3CC", borderRadius: 28, padding: 20, gap: 12 }}>
          <Text style={{ color: INK, fontSize: 18, fontFamily: "REM_BOLD" }}>Change password</Text>
          <TextInput
            value={pw}
            onChangeText={setPw}
            placeholder="New password (8+ characters)"
            placeholderTextColor={PLACEHOLDER}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            style={field}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            placeholderTextColor={PLACEHOLDER}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            style={field}
          />
          <Pressable onPress={() => setShow((s) => !s)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
            <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_BOLD" }}>{show ? "Hide" : "Show"} password</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={close}
              disabled={saving}
              style={{ flex: 1, backgroundColor: "#fff", borderRadius: 32, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} disabled={saving} style={{ flex: 1, borderRadius: 32, overflow: "hidden", opacity: saving ? 0.7 : 1 }}>
              <LinearGradient colors={ORANGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: "center" }}>
                {saving ? (
                  <ActivityIndicator color={INK} />
                ) : (
                  <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Save</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- screen ---------- */

export default function ProfileScreen() {
  const router = useRouter();
  const { role, userId, signOut } = useAuth();
  const official = role === "official";

  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [draft, setDraft] = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const { data: row, offline, refresh } = useCached<any>(
    userId ? `profile:${userId}` : null,
    async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).single();
      if (error) throw error;
      return data;
    }
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // copy the loaded profile into the screen (but never overwrite what's being edited)
  useEffect(() => {
    if (row && !editing) {
      const p = fromRow(row);
      setProfile(p);
      setDraft(p);
    }
  }, [row]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const data = editing ? draft : profile;
  const set = (key: keyof Profile) => (t: string) => setDraft((d) => ({ ...d, [key]: t }));

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const save = async () => {
    if (saving) return;
    if (!draft.fullName.trim()) return Alert.alert("Missing info", "Full name can't be empty.");
    if (!draft.contact.trim()) return Alert.alert("Missing info", "Enter your contact number.");

    // only send columns this role can edit
    const payload: Record<string, string> = {
      full_name: draft.fullName.trim(),
      contact: draft.contact.trim(),
      emergency_name: draft.emergencyName.trim(),
      emergency_relation: draft.emergencyRelation.trim(),
      emergency_contact: draft.emergencyContact.trim(),
    };
    if (!official) {
      payload.birthdate = draft.birthdate.trim();
      payload.sex = draft.sex.trim();
      payload.civil_status = draft.civilStatus.trim();
      payload.address = draft.address.trim();
      payload.purok = draft.purok.trim();
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId!);
    setSaving(false);

    if (error) return Alert.alert("Couldn't save", needsInternet(error));
    setProfile(draft);
    setEditing(false);
    refresh();
  };

  const pickPhoto = async () => {
    if (uploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to change your picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (res.canceled) return;

    setUploading(true);
    try {
      // small flat JPEG
      const out = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const path = `${userId}/${Crypto.randomUUID()}.jpg`;
      await uploadImage("avatars", path, out.uri);

      const { error } = await supabase.from("profiles").update({ photo_path: path }).eq("id", userId!);
      if (error) {
        supabase.storage.from("avatars").remove([path]).catch(() => {});
        throw error;
      }

      const old = profile.photoPath;
      setProfile((p) => ({ ...p, photoPath: path }));
      setDraft((d) => ({ ...d, photoPath: path }));
      if (old) supabase.storage.from("avatars").remove([old]).catch(() => {});
      refresh();
    } catch (e: any) {
      console.log("avatar error:", e);
      Alert.alert("Couldn't change your photo", e?.message ?? "Check your internet and try again.");
    } finally {
      setUploading(false);
    }
  };

  const logout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const initials = data.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const photo = avatarUrl(profile.photoPath);
  const verified = profile.status === "approved";

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
    <Page
      title="Profile"
      variant={official ? "official" : "resident"}
      refreshing={refreshing}
      onRefresh={onRefresh}
      right={
        !editing ? (
          <Pressable onPress={startEdit} hitSlop={12} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="create-outline" size={20} color={official ? GOLD : INK} />
            <Text style={{ color: official ? GOLD : INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Edit</Text>
          </Pressable>
        ) : undefined
      }
    >
      {offline && (
        <Text
          style={{
            color: "#7A3E00",
            backgroundColor: "#FFD9A8",
            borderRadius: 16,
            padding: 8,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "REM_BOLD",
          }}
        >
          Couldn't reach the server. Showing saved data. Changes need internet.
        </Text>
      )}

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
            {uploading ? (
              <ActivityIndicator color={INK} />
            ) : photo ? (
              <Image source={{ uri: photo }} style={{ width: 104, height: 104 }} />
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

        <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD", marginTop: 4 }}>
          {data.fullName || "Your name"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
            {official ? profile.position || "Barangay Official" : "Resident"}
          </Text>
          {verified && (
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
          )}
        </View>
      </View>

      <Card title="Personal information">{renderRows(official ? PERSONAL_OFFICIAL : PERSONAL_RESIDENT)}</Card>
      {!official && <Card title="Home address">{renderRows(ADDRESS)}</Card>}
      <Card title="Emergency contact">{renderRows(EMERGENCY)}</Card>

      {/* Save / cancel while editing */}
      {editing && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={cancelEdit}
            disabled={saving}
            style={{ flex: 1, backgroundColor: "#fff", borderRadius: 32, paddingVertical: 15, alignItems: "center" }}
          >
            <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={save} disabled={saving} style={{ flex: 1, borderRadius: 32, overflow: "hidden", opacity: saving ? 0.7 : 1 }}>
            <LinearGradient colors={ORANGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: "center" }}>
              {saving ? (
                <ActivityIndicator color={INK} />
              ) : (
                <Text style={{ color: INK, fontSize: 15, fontFamily: "REM_BOLD" }}>Save changes</Text>
              )}
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
              onPress={() => router.navigate("/notifications" as any)}
            />
            <SettingRow icon="lock-closed-outline" label="Change password" onPress={() => setPwOpen(true)} />
            <SettingRow
              icon="help-circle-outline"
              label="Help & support"
              onPress={() => Alert.alert("Sir, di pa po tapos")}
            />
            <SettingRow icon="log-out-outline" label="Log out" onPress={logout} danger last />
          </Card>

          <Text style={{ color: MUTED, fontSize: 11, textAlign: "center", fontFamily: "REM_REGULAR" }}>
            Version 1.0.0
          </Text>
        </>
      )}

      <PasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} />
    </Page>
  );
}