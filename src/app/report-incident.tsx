import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";
const PLACEHOLDER = "#A88B5C";
const MAX_PHOTOS = 3;

const INCIDENT_TYPES = [
  { label: "Noise Complaint", icon: "volume-high-outline" },
  { label: "Theft / Robbery", icon: "lock-open-outline" },
  { label: "Fire", icon: "flame-outline" },
  { label: "Flooding", icon: "water-outline" },
  { label: "Fighting / Violence", icon: "alert-circle-outline" },
  { label: "Road / Accident", icon: "car-outline" },
  { label: "Broken Streetlight", icon: "bulb-outline" },
  { label: "Illegal Dumping", icon: "trash-outline" },
  { label: "Other", icon: "ellipsis-horizontal-circle-outline" },
] as const;

const URGENCY = [
  { label: "Low", bg: "#CDEFD3", text: "#14532D" },
  { label: "Medium", bg: "#FFF1C2", text: "#6B4A00" },
  { label: "Urgent", bg: "#FFC9B8", text: "#7A1F00" },
] as const;

function formatNow() {
  const d = new Date();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { date, time };
}

function Label({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 6, marginLeft: 6 }}>
      {children}
      {required ? <Text style={{ color: "#C2410C" }}> *</Text> : null}
    </Text>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  icon,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: multiline ? 24 : 32,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 4,
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        gap: 10,
      }}
    >
      {icon ? <Ionicons name={icon} size={20} color={MUTED} style={{ marginTop: multiline ? 2 : 0 }} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          flex: 1,
          color: INK,
          fontSize: 14,
          fontFamily: "REM_REGULAR",
          minHeight: multiline ? 110 : 44,
        }}
      />
    </View>
  );
}

export default function IncidentReport() {
  const router = useRouter();
  const now = formatNow();

  const [type, setType] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string>("Medium");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState(now.date);
  const [time, setTime] = useState(now.time);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [involved, setInvolved] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const pickPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Photo limit", `You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach evidence.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Photo limit", `You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const resetForm = () => {
    const fresh = formatNow();
    setType(null);
    setUrgency("Medium");
    setDetails("");
    setDate(fresh.date);
    setTime(fresh.time);
    setAddress("");
    setLandmark("");
    setInvolved("");
    setPhotos([]);
    setAnonymous(false);
    setName("");
    setContact("");
  };

  const submit = () => {
    if (!type) return Alert.alert("Missing info", "Choose an incident type.");
    if (details.trim().length < 10) return Alert.alert("Missing info", "Describe what happened (at least a short sentence).");
    if (!address.trim()) return Alert.alert("Missing info", "Enter where it happened.");
    if (!anonymous && (!name.trim() || !contact.trim()))
      return Alert.alert("Missing info", "Enter your name and contact number, or turn on anonymous report.");

    const payload = {
      type,
      urgency,
      details: details.trim(),
      date,
      time,
      address: address.trim(),
      landmark: landmark.trim(),
      involved: involved.trim(),
      photos,
      reporter: anonymous ? null : { name: name.trim(), contact: contact.trim() },
    };

    // TODO: send `payload` to your backend
    console.log("Incident report:", payload);

    resetForm();

    Alert.alert("Report sent", "The barangay has received your report.", [
      { text: "OK", onPress: () => router.navigate("/") },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
              <Pressable onPress={() => router.navigate("/")} hitSlop={12} style={{ marginRight: 12 }}>
                <Ionicons name="chevron-back" size={28} color={INK} />
              </Pressable>
              <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Incident Report Form</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
          {/* Emergency note */}
          <View
            style={{
              backgroundColor: "#FFD9A8",
              borderRadius: 24,
              padding: 14,
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Ionicons name="warning-outline" size={22} color="#7A3E00" />
            <Text style={{ flex: 1, color: "#7A3E00", fontSize: 12, fontFamily: "REM_REGULAR" }}>
              For emergencies happening now (fire, medical, crime in progress), immediately go to the Emergency SOS Section.
            </Text>
          </View>

          {/* Incident type */}
          <View>
            <Label required>Incident type</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {INCIDENT_TYPES.map((t) => {
                const active = type === t.label;
                return (
                  <Pressable
                    key={t.label}
                    onPress={() => setType(t.label)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? "#FF9A4D" : "#fff",
                    }}
                  >
                    <Ionicons name={t.icon as any} size={16} color={INK} />
                    <Text style={{ color: INK, fontSize: 12, fontFamily: active ? "REM_BOLD" : "REM_REGULAR" }}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Urgency */}
          <View>
            <Label>How urgent is it?</Label>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {URGENCY.map((u) => {
                const active = urgency === u.label;
                return (
                  <Pressable
                    key={u.label}
                    onPress={() => setUrgency(u.label)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: active ? u.bg : "#fff",
                      borderWidth: 2,
                      borderColor: active ? u.text : "transparent",
                    }}
                  >
                    <Text style={{ color: active ? u.text : MUTED, fontSize: 13, fontFamily: "REM_BOLD" }}>
                      {u.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Details */}
          <View>
            <Label required>What happened?</Label>
            <Field
              value={details}
              onChangeText={setDetails}
              placeholder="Describe the incident: what, who, and how it started."
              multiline
            />
          </View>

          {/* Date & time */}
          <View>
            <Label required>When did it happen?</Label>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field value={date} onChangeText={setDate} placeholder="Date" icon="calendar-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Field value={time} onChangeText={setTime} placeholder="Time" icon="time-outline" />
              </View>
            </View>
          </View>

          {/* Location */}
          <View>
            <Label required>Location / Address</Label>
            <View style={{ gap: 10 }}>
              <Field
                value={address}
                onChangeText={setAddress}
                placeholder="Street, purok / zone"
                icon="location-outline"
              />
              <Field
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Nearby landmark (optional)"
                icon="navigate-outline"
              />
            </View>
          </View>

          {/* People involved */}
          <View>
            <Label>People involved / witnesses</Label>
            <Field
              value={involved}
              onChangeText={setInvolved}
              placeholder="Names or descriptions (optional)"
              multiline
            />
          </View>

          {/* Photos */}
          <View>
            <Label>{`Photo evidence (${photos.length}/${MAX_PHOTOS})`}</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((uri, i) => (
                <View key={uri + i} style={{ width: 92, height: 92 }}>
                  <Image source={{ uri }} style={{ width: 92, height: 92, borderRadius: 24 }} />
                  <Pressable
                    onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    hitSlop={8}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: INK,
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}

              {photos.length < MAX_PHOTOS && (
                <>
                  <Pressable
                    onPress={takePhoto}
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 24,
                      backgroundColor: "#FFD966",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="camera-outline" size={26} color={INK} />
                    <Text style={{ color: INK, fontSize: 11, fontFamily: "REM_BOLD" }}>Camera</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickPhoto}
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 24,
                      backgroundColor: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="image-outline" size={26} color={INK} />
                    <Text style={{ color: INK, fontSize: 11, fontFamily: "REM_BOLD" }}>Gallery</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Reporter info */}
          <View>
            <Label>Your information</Label>
            <View style={{ gap: 10 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 32,
                  paddingVertical: 10,
                  paddingLeft: 16,
                  paddingRight: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Report anonymously</Text>
                  <Text style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                    Your name and number won't be attached.
                  </Text>
                </View>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: "#E5D3A8", true: "#FF9A4D" }}
                  thumbColor="#fff"
                />
              </View>

              {!anonymous && (
                <>
                  <Field value={name} onChangeText={setName} placeholder="Full name" icon="person-outline" />
                  <Field
                    value={contact}
                    onChangeText={setContact}
                    placeholder="Contact number"
                    keyboardType="phone-pad"
                    icon="call-outline"
                  />
                </>
              )}
            </View>
          </View>

          {/* Submit */}
          <Pressable onPress={submit} style={{ borderRadius: 32, overflow: "hidden", marginTop: 4 }}>
            <LinearGradient
              colors={ORANGE}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="send-outline" size={18} color={INK} />
              <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>Submit report</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}