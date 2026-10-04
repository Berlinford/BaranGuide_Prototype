import { Ionicons } from "@expo/vector-icons";
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
import { useAuth } from "../../context/AuthContext";

const DEMO_ACCOUNTS = [
  { identifier: "juan@email.com", password: "123456", role: "resident" },
  { identifier: "kagawad@email.com", password: "123456", role: "official" },
] as const;

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const INK = "#3B2300";
const MUTED = "#6B4A1E";
const PLACEHOLDER = "#A88B5C";

const TAGLINE = "Your community services, in your pocket.";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter(); 

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"id" | "pw" | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    if (loading) return;
    if (!identifier.trim()) return Alert.alert("Missing info", "Enter your email or contact number.");
    if (!password) return Alert.alert("Missing info", "Enter your password.");

    setLoading(true);
        try {
        await new Promise((r) => setTimeout(r, 800)); // fake delay

        const account = DEMO_ACCOUNTS.find(
            (a) => a.identifier === identifier.trim().toLowerCase() && a.password === password
        );

        if (!account) {
            Alert.alert("Login failed", "Wrong email or password.");
            return;
        }

        await signIn("demo-token", account.role);
        } catch (e) {
            console.log("Login error:", e);
            Alert.alert("Login failed", "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
  };

  const inputWrap = (active: boolean) => ({
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingHorizontal: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderWidth: 2,
    borderColor: active ? "#FF9A4D" : "transparent",
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FFF1C7" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with app icon (same gradient style as the other screens) */}
        <View
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
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
              paddingTop: 80,
              paddingBottom: 40,
              paddingHorizontal: 24,
              alignItems: "center",
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              overflow: "hidden",
            }}
          >
              {/* TODO: adjust the path if your icon lives somewhere else */}
              <Image
                source={require("@/assets/BaranGuideIcon.png")}
                style={{ width: 200, height: 200, tintColor: "#915c00" }}
                resizeMode="cover"
              />
            <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_REGULAR", marginTop: 2, textAlign: "center" }}>
              {TAGLINE}
            </Text>
          </LinearGradient>
        </View>

        {/* Login form */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 14 }}>
          <View style={{ marginBottom: 4 }}>
            <Text style={{ color: INK, fontSize: 22, fontFamily: "REM_BOLD" }}>Welcome back</Text>
            <Text style={{ color: MUTED, fontSize: 13, fontFamily: "REM_REGULAR", marginTop: 2 }}>
              Log in to continue.
            </Text>
          </View>

          {/* Email / contact */}
          <View style={inputWrap(focused === "id")}>
            <Ionicons name="person-outline" size={20} color={MUTED} />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Email or contact number"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onFocus={() => setFocused("id")}
              onBlur={() => setFocused(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={{ flex: 1, minHeight: 52, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
            />
          </View>

          {/* Password */}
          <View style={inputWrap(focused === "pw")}>
            <Ionicons name="lock-closed-outline" size={20} color={MUTED} />
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
              onSubmitEditing={submit}
              style={{ flex: 1, minHeight: 52, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={MUTED} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => Alert.alert("Coming soon", "Hook this up to your forgot password screen.")}
            hitSlop={8}
            style={{ alignSelf: "flex-end", marginRight: 6 }}
          >
            <Text style={{ color: MUTED, fontSize: 12, fontFamily: "REM_BOLD" }}>Forgot password?</Text>
          </Pressable>

          {/* Login button */}
          <Pressable
            onPress={submit}
            disabled={loading}
            style={{ borderRadius: 32, overflow: "hidden", marginTop: 4, opacity: loading ? 0.8 : 1 }}
          >
            <LinearGradient
              colors={ORANGE}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color={INK} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={INK} />
                  <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>Log in</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Register */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
            <Text style={{ color: MUTED, fontSize: 13, fontFamily: "REM_REGULAR" }}>New user?  </Text>
            <Pressable onPress={() => router.navigate("/register")} hitSlop={8}>
                <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}