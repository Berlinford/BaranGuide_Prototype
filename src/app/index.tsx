import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

const ORANGE = ["#FFD966", "#FF9A4D"] as const;
const RED = ["#7F1D1D", "#DC2626"] as const;

const R = { fontFamily: "REM_REGULAR" } as const;
const B = { fontFamily: "REM_BOLD" } as const;

const announcements = [
  { id: 1, title: "Water interruption this Sunday", date: "Posted today" },
  { id: 2, title: "Free pet vaccination", date: "Oct 1" },
  { id: 3, title: "Speed Lover", date: "Oct 1" },
];

const events = [
  { id: 1, month: "OCT", day: "12", title: "Barangay assembly", time: "2:00 PM" },
  { id: 2, month: "OCT", day: "18", title: "Health check-up", time: "8:00 AM" },
  { id: 3, month: "OCT", day: "25", title: "Community clean-up", time: "9:00 AM" },
  { id: 4, month: "NOV", day: "02", title: "Feeding program", time: "10:00 AM" },
  { id: 5, month: "NOV", day: "09", title: "Livelihood seminar", time: "1:00 PM" },
];

function Gradient({ children, style }: any) {
  return (
    <LinearGradient colors={ORANGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

function EventCard({ e }: any) {
  return (
    <View className="bg-white rounded-3xl px-4 py-3 flex-row items-center" style={{ gap: 12 }}>
      <View className="bg-amber-400 rounded-xl w-12 py-1 items-center">
        <Text className="text-ink text-xs" style={R}>{e.month}</Text>
        <Text className="text-ink text-lg" style={B}>{e.day}</Text>
      </View>
      <View>
        <Text className="text-ink" style={B}>{e.title}</Text>
        <Text className="text-ink text-xs" style={R}>{e.time}</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const [showEvents, setShowEvents] = useState(false);
  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
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

        <Gradient
          style={{
            paddingTop: 48,
            paddingHorizontal: 16,
            paddingBottom: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
          }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-ink" style={R}>Welcome</Text>
          </View>

          <View className="flex-row justify-between items-center" style={{ paddingRight: 20 }}>
            <Text className="text-ink text-2xl" style={B}>Kian Lagdaan!</Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Ionicons name="notifications" size={24} color="#3B2300" />
              <Pressable
                onPress={() => router.navigate("/profile")}
                className="bg-orange-700 w-9 h-9 rounded-full items-center justify-center"
              >
                <Text className="text-white" style={B}>FN</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-ink text-xs" style={R}>Barangay Bagong Anyo, Liliw, Laguna</Text>
        </Gradient>
      </View>

      <View className="px-4 mt-4" style={{ gap: 12 }}>
        <View className="flex-row" style={{ gap: 12 }}>
          <Pressable className="flex-1" onPress={() => router.push("/document-request")}>
            <Gradient style={{ borderRadius: 16, padding: 16, minHeight: 90, justifyContent: "flex-end" }}>
              <Ionicons name="document-text-outline" size={24} color="#3B2300" />
              <Text className="text-ink mt-1" style={B}>Document Request</Text>
            </Gradient>
          </Pressable>
          <Pressable className="flex-1" onPress={() => router.push("/report-incident")}>
            <Gradient style={{ borderRadius: 16, padding: 16, minHeight: 90, justifyContent: "flex-end" }}>
              <Ionicons name="megaphone-outline" size={24} color="#3B2300" />
              <Text className="text-ink mt-1" style={B}>Report Incident</Text>
            </Gradient>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/sos")}>
          <LinearGradient
            colors={RED}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="warning" size={28} color="white" />
            <View>
              <Text className="text-white text-lg" style={B}>Emergency SOS</Text>
              <Text className="text-white text-xs" style={R}>Hold 3 seconds to send</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.navigate("/requests")}>
          <Gradient style={{ borderRadius: 16, padding: 16 }}>
            <View className="flex-row justify-between">
              <Text className="text-ink" style={B}>Your Active Request</Text>
              <Text className="text-ink text-xs" style={R}>Processing</Text>
            </View>
            <Text className="text-ink mt-1" style={R}>Barangay Clearance</Text>
            <View className="bg-white/50 h-2 rounded-full mt-3">
              <View className="bg-orange-700 h-2 rounded-full" style={{ width: "66%" }} />
            </View>
          </Gradient>
        </Pressable>

        <Text className="text-ink text-base mt-2" style={[B, { paddingBottom: 4 }]}>Announcements</Text>
      </View>

      <Modal
        visible={showEvents}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowEvents(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 }}>
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowEvents(false)}
          />

          <View style={{ height: "75%", backgroundColor: "#FFF3CC", borderRadius: 28, padding: 20 }}>
            <View className="flex-row items-center mb-4">
              <Pressable onPress={() => setShowEvents(false)} style={{ width: 40 }}>
                <Ionicons name="chevron-back" size={28} color="#3B2300" />
              </Pressable>
              <Text className="text-ink text-lg flex-1 text-center" style={B}>Upcoming Events</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {events.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {announcements.map((a) => (
          <View key={a.id} className="bg-white rounded-2xl overflow-hidden" style={{ width: 240 }}>
            <View className="bg-orange-200 h-28 items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#B45309" />
            </View>
            <View className="p-3">
              <Text className="text-ink" style={B}>{a.title}</Text>
              <Text className="text-ink text-xs mt-1" style={R}>{a.date}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-4 mt-4" style={{ gap: 8 }}>
        <View className="flex-row justify-between items-center">
          <Text className="text-ink text-base" style={B}>Upcoming Events</Text>
          <Pressable onPress={() => setShowEvents(true)}>
            <Text className="text-orange-700 text-sm" style={B}>See all</Text>
          </Pressable>
        </View>

        {events.slice(0, 3).map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </View>
    </ScrollView>
  );
}