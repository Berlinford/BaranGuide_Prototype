import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Linking,
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
const RED = "#D92D20";
const HOLD_MS = 1500; // how long to hold the button
const COUNTDOWN = 5; // seconds to cancel before the alert is sent

// TODO: replace with your barangay's real numbers
const HOTLINES = [
  { label: "Emergency", number: "911", icon: "call-outline" },
  { label: "Barangay", number: "09000000000", icon: "home-outline" },
  { label: "Police", number: "117", icon: "shield-outline" },
  { label: "Fire", number: "09000000001", icon: "flame-outline" },
] as const;

const EMERGENCY_TYPES = [
  { label: "Medical", icon: "medkit-outline" },
  { label: "Fire", icon: "flame-outline" },
  { label: "Crime", icon: "shield-outline" },
  { label: "Disaster", icon: "water-outline" },
  { label: "Other", icon: "alert-circle-outline" },
] as const;

type Phase = "idle" | "countdown" | "sent";
type Coords = { latitude: number; longitude: number } | null;

export default function SOS() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(COUNTDOWN);
  const [type, setType] = useState<string>("Other");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<Coords>(null);
  const [address, setAddress] = useState("");
  const [locStatus, setLocStatus] = useState<"loading" | "ok" | "denied">("loading");
  const [refNo, setRefNo] = useState("");

  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get location as soon as the screen opens so it's ready when needed
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          if (active) setLocStatus("denied");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocStatus("ok");

        const [place] = await Location.reverseGeocodeAsync(pos.coords);
        if (active && place) {
          const parts = [place.street, place.district, place.city, place.region].filter(Boolean);
          setAddress(parts.join(", "));
        }
      } catch {
        if (active) setLocStatus("denied");
      }
    })();
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const startHold = () => {
    if (phase !== "idle") return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) startCountdown();
    });
  };

  const cancelHold = () => {
    if (phase !== "idle") return;
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const startCountdown = () => {
    setPhase("countdown");
    setCount(COUNTDOWN);
    let left = COUNTDOWN;
    timer.current = setInterval(() => {
      left -= 1;
      setCount(left);
      if (left <= 0) {
        if (timer.current) clearInterval(timer.current);
        sendAlert();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (timer.current) clearInterval(timer.current);
    progress.setValue(0);
    setPhase("idle");
  };

  const sendAlert = () => {
    const ref = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      ref,
      type,
      note: note.trim(),
      coords,
      address: address.trim(),
      sentAt: new Date().toISOString(),
    };

    // TODO: send `payload` to your backend
    console.log("SOS alert:", payload);

    setRefNo(ref);
    setPhase("sent");
  };

  const reset = () => {
    progress.setValue(0);
    setType("Other");
    setNote("");
    setPhase("idle");
  };

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert("Can't place call", "Your device couldn't open the phone app.")
    );
  };

  const ringSize = progress.interpolate({ inputRange: [0, 1], outputRange: [190, 250] });
  const ringOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });

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
            <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>SOS</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
        {phase === "sent" ? (
          /* ---------- SENT ---------- */
          <View style={{ alignItems: "center", paddingVertical: 24, gap: 14 }}>
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
            <Text style={{ color: INK, fontSize: 22, fontFamily: "REM_BOLD" }}>Alert sent</Text>
            <Text style={{ color: MUTED, fontSize: 13, textAlign: "center", fontFamily: "REM_REGULAR" }}>
              The barangay has your location and will respond. Stay where you are if it's safe.
            </Text>
            <View style={{ backgroundColor: "#fff", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10 }}>
              <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>Reference: {refNo}</Text>
            </View>

            <Pressable
              onPress={() => callNumber("911")}
              style={{
                alignSelf: "stretch",
                backgroundColor: RED,
                borderRadius: 32,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontFamily: "REM_BOLD" }}>Call 911 now</Text>
            </Pressable>

            <Pressable
              onPress={reset}
              style={{ alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 32, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Emergency type */}
            <View>
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 6, marginLeft: 6 }}>
                What kind of emergency?
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {EMERGENCY_TYPES.map((t) => {
                  const active = type === t.label;
                  return (
                    <Pressable
                      key={t.label}
                      disabled={phase === "countdown"}
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

            {/* SOS button */}
            <View style={{ alignItems: "center", justifyContent: "center", height: 270 }}>
              <Animated.View
                style={{
                  position: "absolute",
                  width: ringSize,
                  height: ringSize,
                  borderRadius: 200,
                  backgroundColor: RED,
                  opacity: phase === "countdown" ? 0.3 : ringOpacity,
                }}
              />
              {phase === "countdown" ? (
                <Pressable
                  onPress={cancelCountdown}
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    backgroundColor: INK,
                    alignItems: "center",
                    justifyContent: "center",
                    elevation: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 54, fontFamily: "REM_BOLD" }}>{count}</Text>
                  <Text style={{ color: "#FFD966", fontSize: 14, fontFamily: "REM_BOLD" }}>Tap to cancel</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPressIn={startHold}
                  onPressOut={cancelHold}
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    backgroundColor: RED,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 44, fontFamily: "REM_BOLD" }}>SOS</Text>
                  <Text style={{ color: "#FFE3DF", fontSize: 12, fontFamily: "REM_REGULAR" }}>Press and hold</Text>
                </Pressable>
              )}
            </View>

            <Text style={{ color: MUTED, fontSize: 12, textAlign: "center", fontFamily: "REM_REGULAR", marginTop: -8 }}>
              {phase === "countdown"
                ? "Sending your alert. Tap the button to stop it."
                : "Hold for 1.5 seconds. You'll get 5 seconds to cancel before it's sent."}
            </Text>

            {/* Location */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 32,
                paddingVertical: 12,
                paddingLeft: 12,
                paddingRight: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: locStatus === "ok" ? "#CDEFD3" : "#FFD966",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={locStatus === "ok" ? "location" : "location-outline"}
                  size={22}
                  color={locStatus === "ok" ? "#14532D" : INK}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
                  {locStatus === "ok" ? "Location ready" : locStatus === "loading" ? "Finding your location..." : "Location unavailable"}
                </Text>
                <Text numberOfLines={2} style={{ color: MUTED, fontSize: 11, marginTop: 2, fontFamily: "REM_REGULAR" }}>
                  {locStatus === "ok"
                    ? address || "Using GPS coordinates"
                    : locStatus === "denied"
                    ? "Turn on location access, or type your address below."
                    : "This only takes a few seconds."}
                </Text>
              </View>
            </View>

            {/* Manual address fallback */}
            {locStatus === "denied" && (
              <View style={{ backgroundColor: "#fff", borderRadius: 32, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="navigate-outline" size={20} color={MUTED} />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, purok / zone"
                  placeholderTextColor={PLACEHOLDER}
                  style={{ flex: 1, minHeight: 48, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
                />
              </View>
            )}

            {/* Optional note */}
            <View style={{ backgroundColor: "#fff", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", gap: 10 }}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={MUTED} style={{ marginTop: 2 }} />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a short note (optional)"
                placeholderTextColor={PLACEHOLDER}
                multiline
                editable={phase === "idle"}
                textAlignVertical="top"
                style={{ flex: 1, minHeight: 60, color: INK, fontSize: 14, fontFamily: "REM_REGULAR" }}
              />
            </View>

            {/* Quick dial */}
            <View>
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD", marginBottom: 8, marginLeft: 6 }}>
                Call directly
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {HOTLINES.map((h) => (
                  <Pressable
                    key={h.label}
                    onPress={() => callNumber(h.number)}
                    style={{
                      width: "48%",
                      backgroundColor: "#fff",
                      borderRadius: 32,
                      paddingVertical: 10,
                      paddingLeft: 10,
                      paddingRight: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
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
                      <Ionicons name={h.icon as any} size={18} color={INK} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>
                        {h.label}
                      </Text>
                      <Text numberOfLines={1} style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                        {h.number}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}