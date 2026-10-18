import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, Linking } from "react-native";
import { useAuth } from "../context/AuthContext";
import { registerForPush } from "../lib/push";

export default function PushSetup() {
  const router = useRouter();
  const { role, userId, loading } = useAuth();
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  // officials register this phone for SOS alerts
  useEffect(() => {
    if (loading || role !== "official" || !userId) return;
    registerForPush().then((r) => {
      if (r === "denied") {
        Alert.alert(
          "Turn on notifications",
          "Without notifications, you won't be alerted when a resident sends an SOS.",
          [
            { text: "Later", style: "cancel" },
            { text: "Open settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    });
  }, [loading, role, userId]);

  // tapping a notification opens its screen (also works when the app was closed)
  useEffect(() => {
    if (!last || loading || !role) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;

    const route = last.notification.request.content.data?.route;
    if (typeof route === "string") setTimeout(() => router.navigate(route as any), 600);
  }, [last, loading, role]);

  return null;
}