import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

  export const SOS_CHANNEL = "sos-alerts-v4";
  export const GENERAL_CHANNEL = "general-v2";

async function setupChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(GENERAL_CHANNEL, {
    name: "Updates",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "notification.mp3",
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(SOS_CHANNEL, {
    name: "SOS emergency alerts",
    importance: Notifications.AndroidImportance.MAX,
    sound: "sos_alert.mp3",
    vibrationPattern: [0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000],
    lightColor: "#D92D20",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    enableVibrate: true,
    enableLights: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}

const getToken = async () => {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
};

/** Asks permission and saves this phone's token. Returns "denied" if permission was refused. */
export async function registerForPush(): Promise<"ok" | "denied" | "unsupported"> {
  if (!Device.isDevice) return "unsupported";

  await setupChannel(); // must exist before the token is requested

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return "denied";

  try {
    const token = await getToken();
     const { error } = await supabase.rpc("save_push_token", { p_token: token });
    if (error) {
      console.log("save_push_token error:", error.message);
      return "unsupported";
    }
    return "ok";
  } catch (e) {
    console.log("push register error:", e);
    return "unsupported";
  }
}

/** Call before signing out so the next person on this phone doesn't get the alerts. */
export async function unregisterPush() {
  try {
    const token = await getToken();
    await supabase.rpc("remove_push_token", { p_token: token });
  } catch {}
}