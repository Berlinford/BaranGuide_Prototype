import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, INK, MUTED, Page } from "../../components/ui";

// TODO: edit these answers so they match how your barangay really works
const FAQS = [
  {
    q: "How do I request a document?",
    a: "Go to Home and tap Document Request. Choose the document, fill in the details, and submit. You can follow the status under Requests.",
  },
  {
    q: "How will I know when my document is ready?",
    a: "The status changes to Ready on the Requests tab, and you'll get a notification. Bring a valid ID when you pick it up at the barangay hall.",
  },
  {
    q: "How do I report an incident?",
    a: "Tap Report Incident on Home, pick the type, describe what happened, add the location and photos if you can, then submit. You can track it under Reports.",
  },
  {
    q: "What does the SOS button do?",
    a: "It sends your location and emergency type to barangay officials so they can respond. Tap it 3 times, and you'll have a few seconds to cancel. For life-threatening emergencies, also call 911.",
  },
  {
    q: "Why is my account still pending?",
    a: "New accounts are checked by barangay staff against your valid ID before they're activated. This can take a little while, so please check back later.",
  },
  {
    q: "How do I change my details?",
    a: "Open Profile, tap Edit, update your information, and save.",
  },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Page title="Help & FAQs">
      <Card style={{ paddingVertical: 4 }}>
        {FAQS.map((f, i) => {
          const open = openIndex === i;
          return (
            <Pressable
              key={f.q}
              onPress={() => setOpenIndex(open ? null : i)}
              style={{
                paddingVertical: 14,
                gap: 8,
                borderBottomWidth: i === FAQS.length - 1 ? 0 : 1,
                borderBottomColor: "#F5E6BE",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ flex: 1, color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>{f.q}</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
              </View>
              {open && (
                <Text style={{ color: INK, fontSize: 12, lineHeight: 19, fontFamily: "REM_REGULAR" }}>{f.a}</Text>
              )}
            </Pressable>
          );
        })}
      </Card>

      <View style={{ flexDirection: "row", gap: 10, backgroundColor: "#FFD9A8", borderRadius: 20, padding: 14, alignItems: "center" }}>
        <Ionicons name="business-outline" size={22} color="#7A3E00" />
        <Text style={{ flex: 1, color: "#7A3E00", fontSize: 12, fontFamily: "REM_REGULAR" }}>
          Still need help? Visit the barangay hall and ask the staff.
        </Text>
      </View>
    </Page>
  );
}