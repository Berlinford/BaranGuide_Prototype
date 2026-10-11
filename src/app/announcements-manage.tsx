import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, Switch, Text, TextInput, View } from "react-native";
import AnnouncementCard, { Category, NewsCard, Post } from "../../components/AnnouncementCard";
import {
  ActionButton,
  Card,
  EmptyState,
  FilterTabs,
  GOLD,
  INK,
  MUTED,
  Page,
  PLACEHOLDER,
} from "../../components/ui";
import { useCached } from "../../lib/offline";
import { supabase } from "../../lib/supabase";
import { uploadPhoto } from "../../lib/upload";

const CATEGORIES = ["Announcement", "Advisory", "Event"] as const;

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={PLACEHOLDER}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={{
        backgroundColor: "#FFF1C7",
        borderRadius: multiline ? 20 : 28,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 0,
        minHeight: multiline ? 100 : 48,
        color: INK,
        fontSize: 14,
        fontFamily: "REM_REGULAR",
      }}
    />
  );
}

export default function AnnouncementsManage() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [category, setCategory] = useState<Category>("Announcement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null); // flattened JPEG on the phone

  const { data, loading, offline, refresh } = useCached<Post[]>("announcements", async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, category, title, body, location, urgent, event_date, event_time, image_path, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Post[];
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const resetForm = () => {
    setCategory("Announcement");
    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate("");
    setEventTime("");
    setUrgent(false);
    setImageUri(null);
  };

  const failMessage = (e: { code?: string; message: string }) =>
    e.code ? e.message : "You need internet to do this. Try again once you're online.";

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to add a picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (res.canceled) return;

    try {
      // resize + re-encode as a plain JPEG (also flattens transparent PNGs)
      const out = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(out.uri);
    } catch (e) {
      console.log("pickImage error:", e);
      Alert.alert("Couldn't read the photo", "Try a different picture.");
    }
  };

  const publish = async () => {
    if (saving) return;
    if (!title.trim()) return Alert.alert("Missing info", "Enter a title.");
    if (!description.trim()) return Alert.alert("Missing info", "Write a description.");
    if (!imageUri) return Alert.alert("Missing info", "Add a photo for this post.");
    if (!location.trim()) return Alert.alert("Missing info", "Enter the location.");
    if (category === "Event" && (!eventDate.trim() || !eventTime.trim()))
      return Alert.alert("Missing info", "Enter the event date and time.");

    setSaving(true);

    // 1. upload the photo
    const imagePath = `${Crypto.randomUUID()}.jpg`;
    try {
      await uploadPhoto("announcements", imagePath, imageUri);
    } catch (e: any) {
      console.log("upload error:", e);
      setSaving(false);
      return Alert.alert("Couldn't upload the photo", e?.message ?? "Check your internet and try again.");
    }

    // 2. save the post
    const { error } = await supabase.from("announcements").insert({
      category,
      title: title.trim(),
      body: description.trim(),
      location: location.trim(),
      urgent,
      event_date: category === "Event" ? eventDate.trim() : null,
      event_time: category === "Event" ? eventTime.trim() : null,
      image_path: imagePath,
    });
    setSaving(false);

    if (error) {
      // don't leave an orphaned photo behind
      supabase.storage.from("announcements").remove([imagePath]).catch(() => {});
      return Alert.alert("Couldn't publish", failMessage(error));
    }

    resetForm();
    setShowForm(false);
    refresh();
  };

  const remove = (p: Post) =>
    Alert.alert("Delete post?", `"${p.title}" will disappear for all residents.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("announcements").delete().eq("id", p.id);
          if (error) return Alert.alert("Couldn't delete", failMessage(error));
          if (p.image_path) supabase.storage.from("announcements").remove([p.image_path]).catch(() => {});
          refresh();
        },
      },
    ]);

  const posts = (data ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <Page title="Announcements" variant="official" refreshing={refreshing} onRefresh={onRefresh}>
      {!showForm ? (
        <Pressable
          onPress={() => setShowForm(true)}
          style={{
            backgroundColor: INK,
            borderRadius: 32,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color={GOLD} />
          <Text style={{ color: GOLD, fontSize: 15, fontFamily: "REM_BOLD" }}>New post</Text>
        </Pressable>
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD" }}>New post</Text>

          <FilterTabs options={CATEGORIES} value={category} onChange={setCategory} />

          <Input value={title} onChangeText={setTitle} placeholder="Title" />
          <Input value={description} onChangeText={setDescription} placeholder="Description" multiline />
          <Input
            value={location}
            onChangeText={setLocation}
            placeholder="Location (e.g. Barangay hall)"
          />

          {/* Photo (required) */}
          {imageUri ? (
            <View>
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: "#FFE0B0" }}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setImageUri(null)}
                hitSlop={8}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: INK,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              style={{
                backgroundColor: "#FFF1C7",
                borderRadius: 20,
                paddingVertical: 22,
                alignItems: "center",
                gap: 4,
                borderWidth: 2,
                borderColor: "#F5E6BE",
                borderStyle: "dashed",
              }}
            >
              <Ionicons name="image-outline" size={28} color={MUTED} />
              <Text style={{ color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>
                Add a photo <Text style={{ color: "#C2410C" }}>*</Text>
              </Text>
            </Pressable>
          )}

          {category === "Event" && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input value={eventDate} onChangeText={setEventDate} placeholder="Date (Oct 12)" />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={eventTime} onChangeText={setEventTime} placeholder="Time (2:00 PM)" />
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>Mark as urgent</Text>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
                Pins it to the top of residents' list
              </Text>
            </View>
            <Switch
              value={urgent}
              onValueChange={setUrgent}
              trackColor={{ false: "#E5D3A8", true: "#FF9A4D" }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <ActionButton
              label="Cancel"
              tone="ghost"
              disabled={saving}
              onPress={() => {
                resetForm();
                setShowForm(false);
              }}
            />
            <ActionButton
              label={saving ? "Publishing..." : "Publish"}
              icon="send-outline"
              disabled={saving}
              onPress={publish}
            />
          </View>
        </Card>
      )}

      {offline && (
        <Text
          style={{
            color: "#7A3E00",
            backgroundColor: "#FFD9A8",
            borderRadius: 16,
            padding: 8,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "REM_BOLD",
          }}
        >
          Couldn't reach the server. Showing saved data. Posting needs internet.
        </Text>
      )}

      <Text style={{ color: INK, fontSize: 16, fontFamily: "REM_BOLD", marginLeft: 4 }}>
        Posted ({posts.length})
      </Text>

      {loading ? (
        <Text style={{ color: INK, textAlign: "center", fontFamily: "REM_REGULAR" }}>Loading...</Text>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="No posts yet"
          sub="Residents will see your posts in their announcements."
        />
      ) : (
        posts.map((p) =>
          p.category === "Event" ? (
            <AnnouncementCard key={p.id} post={p} onDelete={remove} compact/>
          ) : (
            <NewsCard key={p.id} post={p} onDelete={remove} fullWidth />
          )
        )
      )}
    </Page>
  );
}