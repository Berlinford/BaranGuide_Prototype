import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const FIELD_BG = "#ffffff";
const INK = "#3B2300";

const DOCUMENT_TYPES = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Barangay ID",
  "Business Clearance",
];

function Field({ label, style, inputStyle, ...props }: any) {
  return (
    <View style={style}>
      <Text style={{ color: INK, fontSize: 13, marginBottom: 4, marginLeft: 12, fontFamily: "REM_BOLD" }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#8A6A3A"
        style={[
          {
            backgroundColor: FIELD_BG,
            borderRadius: 24,
            paddingHorizontal: 16,
            height: 48,
            color: INK,
            fontFamily: "REM_REGULAR",
          },
          inputStyle,
        ]}
        {...props}
      />
    </View>
  );
}

export default function DocumentRequest() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [docType, setDocType] = useState("");
  const [copies, setCopies] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate("/");
  };

  const submit = () => {
    if (!fullName.trim() || !contact.trim() || !address.trim() || !docType || !purpose.trim()) {
      Alert.alert("Missing information", "Please fill in all the fields.");
      return;
    }
    if (!copies || Number(copies) < 1) {
      Alert.alert("Copies", "Please enter at least 1 copy.");
      return;
    }
    Alert.alert("Request submitted", `Your ${docType} request has been sent.`, [
      { text: "OK", onPress: () => router.navigate("/") },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFF1C7" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* Header (same style as the Home screen) */}
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
          {/* Extension that fills the bounce gap above the header */}
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
              <Pressable onPress={goBack} hitSlop={12} style={{ marginRight: 12 }}>
                <Ionicons name="chevron-back" size={28} color={INK} />
              </Pressable>
              <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>
                Document Request Form
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Padded form content */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Full Name + Contact Number */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <Field
              label="Full Name"
              style={{ flex: 1 }}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Field
              label="Contact Number"
              style={{ flex: 1 }}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address */}
          <Field
            label="Address"
            style={{ marginBottom: 16 }}
            value={address}
            onChangeText={setAddress}
          />

          {/* Document Type + Copies */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontSize: 13, marginBottom: 4, marginLeft: 12, fontFamily: "REM_BOLD" }}>
                Document Type
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={{
                  backgroundColor: FIELD_BG,
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  height: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{ color: docType ? INK : "#8A6A3A", flex: 1, fontFamily: "REM_REGULAR" }}
                >
                  {docType || "Select"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={INK} />
              </Pressable>
            </View>

            <Field
              label="Copies"
              style={{ width: 90 }}
              value={copies}
              onChangeText={(t: string) => setCopies(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
              inputStyle={{ textAlign: "center" }}
            />
          </View>

          {/* Purpose */}
          <Field
            label="Purpose"
            style={{ marginBottom: 20 }}
            value={purpose}
            onChangeText={setPurpose}
            multiline
            textAlignVertical="top"
            inputStyle={{ height: 130, paddingTop: 14, borderRadius: 28 }}
          />

          {/* Submit */}
          <View style={{ alignItems: "flex-end" }}>
            <Pressable
              onPress={submit}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, width: 140 })}
            >
              <LinearGradient
                colors={ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 56, width:120 , borderRadius: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>SUBMIT</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Document type picker */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(59,35,0,0.45)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setPickerOpen(false)}
          />
          <View style={{ backgroundColor: "#FFF1C7", borderRadius: 24, padding: 12 }}>
            <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD", padding: 12 }}>
              Select document type
            </Text>
            {DOCUMENT_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setDocType(type);
                  setPickerOpen(false);
                }}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: docType === type ? FIELD_BG : "transparent",
                }}
              >
                <Text style={{ color: INK, fontFamily: "REM_REGULAR" }}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}