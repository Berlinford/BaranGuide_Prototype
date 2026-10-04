import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { ActionButton, INK, MUTED, Page, PLACEHOLDER } from "../../components/ui";

export default function ForgotPassword() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!identifier.trim()) return Alert.alert("Missing info", "Enter your email or contact number.");

    setLoading(true);
    try {
      // TODO: ask your backend to send a reset link or code
      await new Promise((r) => setTimeout(r, 800)); // fake delay, remove this
      setSent(true);
    } catch {
      Alert.alert("Couldn't send", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Forgot password" backTo="/login">
      {sent ? (
        <View style={{ alignItems: "center", paddingTop: 24, gap: 14 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#CDEFD3", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="mail-outline" size={48} color="#14532D" />
          </View>
          <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>Check your messages</Text>
          {/* Same message whether or not the account exists, so nobody can use this to find out who has an account */}
          <Text style={{ color: MUTED, fontSize: 13, textAlign: "center", fontFamily: "REM_REGULAR" }}>
            If an account matches that email or number, we've sent instructions to reset the password.
          </Text>
          <View style={{ flexDirection: "row", alignSelf: "stretch", marginTop: 8 }}>
            <ActionButton label="Back to login" onPress={() => router.navigate("/login")} />
          </View>
        </View>
      ) : (
        <>
          <Text style={{ color: MUTED, fontSize: 13, fontFamily: "REM_REGULAR" }}>
            Enter the email or mobile number you signed up with and we'll send you a way to reset your password.
          </Text>

          <View style={{ backgroundColor: "#fff", borderRadius: 32, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="person-outline" size={20} color={MUTED} />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Email or contact number"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={submit}
              style={{ flex: 1, minHeight: 52, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
            />
          </View>

          <Pressable
            onPress={submit}
            disabled={loading}
            style={{ backgroundColor: "#FF9A4D", borderRadius: 32, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.8 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color={INK} />
            ) : (
              <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>Send reset instructions</Text>
            )}
          </Pressable>
        </>
      )}
    </Page>
  );
}