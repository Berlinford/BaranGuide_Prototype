import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";
const PLACEHOLDER = "#A88B5C";

type Role = "resident" | "official";

const SEX = ["Male", "Female"] as const;
const CIVIL = ["Single", "Married", "Widowed", "Separated"] as const;
const POSITIONS = [
  "Punong Barangay",
  "Kagawad",
  "SK Chairperson",
  "Secretary",
  "Treasurer",
  "Tanod",
  "Other",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_PHONE_RE = /^(09\d{9}|\+639\d{9})$/;

/* ---------- small building blocks ---------- */

function Label({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD", marginBottom: 6, marginLeft: 6 }}>
      {children}
      {required ? <Text style={{ color: "#C2410C" }}> *</Text> : null}
    </Text>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  secure,
  autoCapitalize = "words",
  inputRef,
  onSubmit,
  returnKeyType = "next",
  right,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "phone-pad" | "email-address" | "number-pad";
  secure?: boolean;
  autoCapitalize?: "none" | "words" | "sentences";
  inputRef?: React.RefObject<TextInput | null>;
  onSubmit?: () => void;
  returnKeyType?: "next" | "done";
  right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 32,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 2,
        borderColor: focused ? "#FF9A4D" : "transparent",
      }}
    >
      <Ionicons name={icon} size={20} color={MUTED} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        style={{ flex: 1, minHeight: 50, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
      />
      {right}
    </View>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? "#FF9A4D" : "#fff",
            }}
          >
            <Text style={{ color: INK, fontSize: 12, fontFamily: active ? "REM_BOLD" : "REM_REGULAR" }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- screen ---------- */

export default function Register() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("resident");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // shared
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  // resident
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState<(typeof SEX)[number] | "">("");
  const [civil, setCivil] = useState<(typeof CIVIL)[number] | "">("");
  const [address, setAddress] = useState("");
  const [purok, setPurok] = useState("");

  // official
  const [position, setPosition] = useState<(typeof POSITIONS)[number] | "">("");
  const [officialId, setOfficialId] = useState("");

  const confirmRef = useRef<TextInput>(null);

  const pickId = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload your ID.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled) setIdPhoto(res.assets[0].uri);
  };

  const takeIdPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to take a photo of your ID.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setIdPhoto(res.assets[0].uri);
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Enter your full name.";

    if (role === "resident") {
      if (!birthdate.trim()) return "Enter your birthdate.";
      if (!sex) return "Select your sex.";
      if (!civil) return "Select your civil status.";
    } else {
      if (!position) return "Select your position.";
      if (!officialId.trim()) return "Enter your official ID number.";
    }

    if (!PH_PHONE_RE.test(contact.replace(/\s|-/g, ""))) return "Enter a valid mobile number (09XXXXXXXXX).";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";

    if (role === "resident") {
      if (!address.trim()) return "Enter your street / house number.";
      if (!purok.trim()) return "Enter your purok / zone.";
    }

    if (!idPhoto) return role === "resident" ? "Upload a valid ID so we can verify you live here." : "Upload your official ID.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords don't match.";
    if (!agree) return "Please agree to the terms and privacy policy.";
    return null;
  };

  const submit = async () => {
    if (loading) return;
    const error = validate();
    if (error) return Alert.alert("Check your details", error);

    const payload = {
      role,
      fullName: fullName.trim(),
      contact: contact.replace(/\s|-/g, ""),
      email: email.trim().toLowerCase(),
      password, // send over HTTPS only, and never store it in plain text
      idPhoto,
      ...(role === "resident"
        ? { birthdate: birthdate.trim(), sex, civilStatus: civil, address: address.trim(), purok: purok.trim() }
        : { position, officialId: officialId.trim() }),
    };

    setLoading(true);
    try {
      // TODO: send `payload` to your backend. The server must create the account as "pending"
      // and let only an admin approve it, especially for officials.
      console.log("Register:", { ...payload, password: "***" });
      await new Promise((r) => setTimeout(r, 800)); // fake delay, remove this
      setDone(true);
    } catch {
      Alert.alert("Sign up failed", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FFF1C7" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header (same style as the other screens) */}
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
              <Pressable onPress={() => router.navigate("/login")} hitSlop={12} style={{ marginRight: 12 }}>
                <Ionicons name="chevron-back" size={28} color={INK} />
              </Pressable>
              <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Create account</Text>
            </View>
          </LinearGradient>
        </View>

        {done ? (
          /* ---------- success ---------- */
          <View style={{ alignItems: "center", paddingHorizontal: 28, paddingTop: 48, gap: 14 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "#CDEFD3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={56} color="#14532D" />
            </View>
            <Text style={{ color: INK, fontSize: 22, fontFamily: "REM_BOLD" }}>Registration sent</Text>
            <Text style={{ color: MUTED, fontSize: 13, textAlign: "center", fontFamily: "REM_REGULAR" }}>
              {role === "resident"
                ? "Barangay staff will check your ID and approve your account. You'll be able to log in once it's approved."
                : "An administrator will verify your position and ID before your official account is activated."}
            </Text>
            <Pressable
              onPress={() => router.replace("/login")}
              style={{ alignSelf: "stretch", borderRadius: 32, overflow: "hidden", marginTop: 10 }}
            >
              <LinearGradient
                colors={ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, alignItems: "center" }}
              >
                <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>Back to login</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 18 }}>
            {/* Account type */}
            <View>
              <Label>I am a</Label>
              <View style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 32, padding: 4 }}>
                {(
                  [
                    { key: "resident", label: "Resident", icon: "people-outline" },
                    { key: "official", label: "Barangay Official", icon: "shield-checkmark-outline" },
                  ] as const
                ).map((r) => {
                  const active = role === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setRole(r.key)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 12,
                        borderRadius: 28,
                        backgroundColor: active ? INK : "transparent",
                      }}
                    >
                      <Ionicons name={r.icon} size={18} color={active ? "#FFD966" : INK} />
                      <Text style={{ color: active ? "#FFD966" : INK, fontSize: 13, fontFamily: "REM_BOLD" }}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {role === "official" && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    backgroundColor: "#FFD9A8",
                    borderRadius: 20,
                    padding: 12,
                    marginTop: 10,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="information-circle-outline" size={20} color="#7A3E00" />
                  <Text style={{ flex: 1, color: "#7A3E00", fontSize: 11, fontFamily: "REM_REGULAR" }}>
                    Official accounts must be verified by an administrator before they can log in.
                  </Text>
                </View>
              )}
            </View>

            {/* Personal */}
            <View style={{ gap: 12 }}>
              <Label required>Full name</Label>
              <View style={{ marginTop: -6 }}>
                <Field value={fullName} onChangeText={setFullName} placeholder="First, middle, last name" icon="person-outline" />
              </View>
            </View>

            {role === "resident" ? (
              <>
                <View>
                  <Label required>Birthdate</Label>
                  <Field
                    value={birthdate}
                    onChangeText={setBirthdate}
                    placeholder="MM/DD/YYYY"
                    icon="calendar-outline"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>
                <View>
                  <Label required>Sex</Label>
                  <Chips options={SEX} value={sex} onChange={setSex} />
                </View>
                <View>
                  <Label required>Civil status</Label>
                  <Chips options={CIVIL} value={civil} onChange={setCivil} />
                </View>
              </>
            ) : (
              <>
                <View>
                  <Label required>Position</Label>
                  <Chips options={POSITIONS} value={position} onChange={setPosition} />
                </View>
                <View>
                  <Label required>Official ID number</Label>
                  <Field
                    value={officialId}
                    onChangeText={setOfficialId}
                    placeholder="e.g. BRGY-OFF-0012"
                    icon="id-card-outline"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            {/* Contact */}
            <View style={{ gap: 10 }}>
              <Label required>Contact details</Label>
              <View style={{ marginTop: -4, gap: 10 }}>
                <Field
                  value={contact}
                  onChangeText={setContact}
                  placeholder="Mobile number (09XXXXXXXXX)"
                  icon="call-outline"
                  keyboardType="phone-pad"
                />
                <Field
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Address (residents only) */}
            {role === "resident" && (
              <View style={{ gap: 10 }}>
                <Label required>Home address</Label>
                <View style={{ marginTop: -4, gap: 10 }}>
                  <Field value={address} onChangeText={setAddress} placeholder="Street / house number" icon="home-outline" />
                  <Field value={purok} onChangeText={setPurok} placeholder="Purok / zone" icon="location-outline" />
                </View>
              </View>
            )}

            {/* ID photo */}
            <View>
              <Label required>{role === "resident" ? "Valid ID (for verification)" : "Official ID photo"}</Label>
              {idPhoto ? (
                <View style={{ alignSelf: "flex-start" }}>
                  <Image source={{ uri: idPhoto }} style={{ width: 200, height: 125, borderRadius: 20 }} />
                  <Pressable
                    onPress={() => setIdPhoto(null)}
                    hitSlop={8}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: INK,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={takeIdPhoto}
                    style={{
                      flex: 1,
                      backgroundColor: "#FFD966",
                      borderRadius: 24,
                      paddingVertical: 18,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="camera-outline" size={26} color={INK} />
                    <Text style={{ color: INK, fontSize: 12, fontFamily: "REM_BOLD" }}>Take photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickId}
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderRadius: 24,
                      paddingVertical: 18,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="image-outline" size={26} color={INK} />
                    <Text style={{ color: INK, fontSize: 12, fontFamily: "REM_BOLD" }}>From gallery</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={{ gap: 10 }}>
              <Label required>Password</Label>
              <View style={{ marginTop: -4, gap: 10 }}>
                <Field
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  icon="lock-closed-outline"
                  secure={!showPw}
                  autoCapitalize="none"
                  onSubmit={() => confirmRef.current?.focus()}
                  right={
                    <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={10}>
                      <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={MUTED} />
                    </Pressable>
                  }
                />
                <Field
                  inputRef={confirmRef}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm password"
                  icon="lock-closed-outline"
                  secure={!showPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmit={submit}
                />
              </View>
            </View>

            {/* Terms */}
            <Pressable onPress={() => setAgree((a) => !a)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: agree ? "#FF9A4D" : "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {agree && <Ionicons name="checkmark" size={16} color={INK} />}
              </View>
              <Text style={{ flex: 1, color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR" }}>
                I agree to the terms of use and privacy policy, and confirm my details are true.
              </Text>
            </Pressable>

            {/* Submit */}
            <Pressable
              onPress={submit}
              disabled={loading}
              style={{ borderRadius: 32, overflow: "hidden", opacity: loading ? 0.8 : 1 }}
            >
              <LinearGradient
                colors={ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
              >
                {loading ? (
                  <ActivityIndicator color={INK} />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color={INK} />
                    <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>Sign up</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ color: MUTED, fontSize: 13, fontFamily: "REM_REGULAR" }}>Already have an account? </Text>
              <Pressable onPress={() => router.navigate("/login")} hitSlop={8}>
                <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>Log in</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}