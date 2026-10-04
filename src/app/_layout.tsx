import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import "./global.css";

function TabBarGradient() {
  return (
    <LinearGradient
      colors={["#FFDE59", "#FF8C4B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

function RootNavigator() {
  const { token, role, loading } = useAuth();

  const [fontsLoaded] = useFonts({
    "REM_BOLD": require("@/assets/fonts/rem_bold.ttf"),
    "REM_REGULAR": require("@/assets/fonts/rem_regular.ttf"),
    "REM_LIGHT": require("@/assets/fonts/rem_light.ttf"),
  });

  // Wait for fonts AND the saved-login check before showing anything
  if (!fontsLoaded || loading) {
    return null;
  }

  const loggedIn = !!token && !!role;
  const isResident = loggedIn && role === "resident";
  const isOfficial = loggedIn && role === "official";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: "#FFF1C7" },
        tabBarActiveTintColor: "#3B2300",
        tabBarInactiveTintColor: "#8A6A3A",
        tabBarLabelStyle: { fontSize: 12, fontFamily: "REM_BOLD" },
        tabBarBackground: TabBarGradient,
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
      {/* RESIDENT only */}
      <Tabs.Protected guard={isResident}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="home-outline" size={28} color={color as string} />;
            },
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: "Requests",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="document-text-outline" size={28} color={color as string} />;
            },
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="megaphone-outline" size={28} color={color as string} />;
            },
          }}
        />
        <Tabs.Screen name="report-incident" options={{ href: null }} />
        <Tabs.Screen name="sos" options={{ href: null }} />
        <Tabs.Screen name="document-request" options={{ href: null }} />
      </Tabs.Protected>

      {/* OFFICIAL only */}
      <Tabs.Protected guard={isOfficial}>
        <Tabs.Screen
          name="officialswindow"
          options={{
            title: "Home",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="grid-outline" size={28} color={color as string} />;
            },
          }}
        />
      </Tabs.Protected>

      {/* Both roles */}
      <Tabs.Protected guard={loggedIn}>
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="person-circle-outline" size={28} color={color as string} />;
            },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: function ({ color }) {
              return <Ionicons name="settings-outline" size={28} color={color as string} />;
            },
          }}
        />
      </Tabs.Protected>

      {/* Logged out, with the tab bar hidden */}
      <Tabs.Protected guard={!loggedIn}>
        <Tabs.Screen
          name="login"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}