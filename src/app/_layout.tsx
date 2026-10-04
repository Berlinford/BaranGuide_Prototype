import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { ComponentProps, useEffect } from "react";
import { ColorValue, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import "./global.css";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

// Fixed TypeScript signature for tabBarIcon helper
const icon =
  (name: IoniconsName) =>
  ({ color }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={name} size={28} color={color as string} />;

function TabBarGradient({ official }: { official: boolean }) {
  return (
    <LinearGradient
      colors={official ? ["#4A2C05", "#2B1A02"] : ["#FFDE59", "#FF8C4B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

function RootNavigator() {
  const router = useRouter();
  const { token, role, loading } = useAuth();

  const [fontsLoaded] = useFonts({
    REM_BOLD: require("@/assets/fonts/rem_bold.ttf"),
    REM_REGULAR: require("@/assets/fonts/rem_regular.ttf"),
    REM_LIGHT: require("@/assets/fonts/rem_light.ttf"),
  });

  const loggedIn = !!token && !!role;
  const isResident = loggedIn && role === "resident";
  const isOfficial = loggedIn && role === "official";

  useEffect(() => {
    if (!fontsLoaded || loading) return;
    if (isOfficial) router.replace("/official-home" as any);
    else if (isResident) router.replace("/" as any);
  }, [isOfficial, isResident, fontsLoaded, loading]);

  if (!fontsLoaded || loading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: "#FFF1C7" },
        tabBarActiveTintColor: isOfficial ? "#FFD966" : "#3B2300",
        tabBarInactiveTintColor: isOfficial ? "#B8956A" : "#8A6A3A",
        tabBarLabelStyle: { fontSize: 12, fontFamily: "REM_BOLD" },
        tabBarBackground: () => <TabBarGradient official={isOfficial} />,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 20,
          marginHorizontal: 10,
          height: 70,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          overflow: "hidden",
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
    >
      {/* ---------- RESIDENT only ---------- */}
      <Tabs.Protected guard={isResident}>
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: icon("home-outline") }}
        />
        <Tabs.Screen
          name="requests"
          options={{ title: "Requests", tabBarIcon: icon("document-text-outline") }}
        />
        <Tabs.Screen
          name="reports"
          options={{ title: "Reports", tabBarIcon: icon("megaphone-outline") }}
        />
        <Tabs.Screen name="report-incident" options={{ href: null }} />
        <Tabs.Screen name="sos" options={{ href: null }} />
        <Tabs.Screen name="document-request" options={{ href: null }} />
        <Tabs.Screen name="announcements" options={{ href: null }} />
        <Tabs.Screen name="hotlines" options={{ href: null }} />
        <Tabs.Screen name="help" options={{ href: null }} />
      </Tabs.Protected>

      {/* ---------- OFFICIAL only ---------- */}
      <Tabs.Protected guard={isOfficial}>
        <Tabs.Screen
          name="official-home"
          options={{ title: "Home", tabBarIcon: icon("grid-outline") }}
        />
        <Tabs.Screen
          name="official-requests"
          options={{ title: "Requests", tabBarIcon: icon("document-text-outline") }}
        />
        <Tabs.Screen
          name="official-reports"
          options={{ title: "Reports", tabBarIcon: icon("clipboard-outline") }}
        />
        <Tabs.Screen
          name="sos-alerts"
          options={{ title: "SOS", tabBarIcon: icon("warning-outline") }}
        />
        <Tabs.Screen name="approvals" options={{ href: null }} />
        <Tabs.Screen name="announcements-manage" options={{ href: null }} />
        <Tabs.Screen name="residents" options={{ href: null }} />
      </Tabs.Protected>

      {/* ---------- BOTH roles ---------- */}
      <Tabs.Protected guard={loggedIn}>
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile", tabBarIcon: icon("person-circle-outline") }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            href: isOfficial ? null : undefined,
            tabBarIcon: icon("settings-outline"),
          }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs.Protected>

      {/* ---------- LOGGED OUT: tab bar hidden ---------- */}
      <Tabs.Protected guard={!loggedIn}>
        <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="register" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="forgot-password" options={{ href: null, tabBarStyle: { display: "none" } }} />
      </Tabs.Protected>
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}