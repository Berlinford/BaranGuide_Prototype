import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { announcementImageUrl } from "../lib/storage";
import { Chip, INK, MUTED } from "./ui";

export type Category = "Announcement" | "Advisory" | "Event";

export type Post = {
  id: string;
  category: Category;
  title: string;
  body: string; // shown as the Description
  location: string | null;
  urgent: boolean;
  event_date: string | null;
  event_time: string | null;
  image_path: string | null;
  created_at: string;
};

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Announcement: { bg: "#FFF1C2", text: "#6B4A00" },
  Advisory: { bg: "#FFD9A8", text: "#7A3E00" },
  Event: { bg: "#CDEFD3", text: "#14532D" },
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Month + day for the yellow badge. Reads the event date ("Oct 13", "10/13", "13 Oct"); falls back to the posted date. */
function badgeFor(p: Post): { month: string; day: string } {
  if (p.event_date) {
    const t = p.event_date.trim();
    const a = t.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2})/); // Oct 13
    if (a) return { month: a[1].slice(0, 3).toUpperCase(), day: String(Number(a[2])) };
    const b = t.match(/^(\d{1,2})[\/\-.](\d{1,2})/); // 10/13
    if (b && Number(b[1]) >= 1 && Number(b[1]) <= 12) return { month: MONTHS[Number(b[1]) - 1], day: String(Number(b[2])) };
    const c = t.match(/^(\d{1,2})\s+([A-Za-z]{3,})/); // 13 Oct
    if (c) return { month: c[2].slice(0, 3).toUpperCase(), day: String(Number(c[1])) };
  }
  const d = new Date(p.created_at);
  return { month: MONTHS[d.getMonth()], day: String(d.getDate()) };
}

const postedLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const postedWhen = (iso: string) => {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return "Posted today";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "#FFD966",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={16} color={INK} />
      </View>
      <Text style={{ flex: 1, color: INK, fontSize: 13, fontFamily: "REM_BOLD" }}>{text}</Text>
    </View>
  );
}

/* ---------- preview popup (used by both cards) ---------- */

export function AnnouncementPreview({
  post,
  onClose,
  onDelete,
}: {
  post: Post | null; // null = closed
  onClose: () => void;
  onDelete?: (p: Post) => void; // officials only: shows a Delete button
}) {
  // keep the last post around so the content doesn't vanish while the popup fades out
  const last = useRef<Post | null>(null);
  if (post) last.current = post;
  const p = post ?? last.current;

  return (
    <Modal visible={!!post} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(59,35,0,0.55)", justifyContent: "center", padding: 20 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {p ? <PreviewBody post={p} onClose={onClose} onDelete={onDelete} /> : null}
      </View>
    </Modal>
  );
}

function PreviewBody({
  post,
  onClose,
  onDelete,
}: {
  post: Post;
  onClose: () => void;
  onDelete?: (p: Post) => void;
}) {
  const img = announcementImageUrl(post.image_path);
  const c = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.Announcement;
  const isEvent = post.category === "Event";
  const eventLine = [post.event_date, post.event_time].filter(Boolean).join(" · ");

  return (
    <View style={{ backgroundColor: "#FFF1C7", borderRadius: 28, overflow: "hidden", maxHeight: "88%" }}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#FFE0B0" }}
            resizeMode="cover"
          />
        ) : null}

        <View style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Chip label={post.category} bg={c.bg} text={c.text} />
            {post.urgent && <Chip label="Urgent" bg="#FFC9B8" text="#7A1F00" />}
          </View>

          <Text style={{ color: INK, fontSize: 20, fontFamily: "REM_BOLD" }}>{post.title}</Text>

          {isEvent && eventLine ? <InfoRow icon="calendar-outline" text={eventLine} /> : null}
          {post.location ? <InfoRow icon="location-outline" text={post.location} /> : null}

          <View>
            <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_BOLD", marginBottom: 4 }}>DESCRIPTION</Text>
            <Text style={{ color: INK, fontSize: 13, lineHeight: 20, fontFamily: "REM_REGULAR" }}>{post.body}</Text>
          </View>

          <Text style={{ color: MUTED, fontSize: 11, fontFamily: "REM_REGULAR" }}>
            Posted {postedLabel(post.created_at)}
          </Text>

          {onDelete ? (
            <Pressable
              onPress={() => {
                onClose();
                setTimeout(() => onDelete(post), 300); // let the popup close first so the alert shows on iOS
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: "#FDE2E0",
                borderRadius: 24,
                paddingVertical: 12,
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#D92D20" />
              <Text style={{ color: "#D92D20", fontSize: 14, fontFamily: "REM_BOLD" }}>Delete post</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        onPress={onClose}
        hitSlop={8}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: INK,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

/* ---------- NewsCard: photo on top, title and date below (the Home announcement card) ---------- */

export function NewsCard({
  post,
  onDelete,
  fullWidth,
}: {
  post: Post;
  onDelete?: (p: Post) => void;
  fullWidth?: boolean; // true = stretch across the screen (management list); false = 240 wide (Home carousel)
}) {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const img = announcementImageUrl(post.image_path);
  const showImg = !!img && !imgFailed;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setOpen(true)}
        style={{
          width: fullWidth ? "100%" : 240,
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {showImg ? (
          <Image
            source={{ uri: img! }}
            style={{ width: "100%", height: 112, backgroundColor: "#FFE0B0" }}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={{ height: 112, backgroundColor: "#FED7AA", alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name={post.urgent ? "alert-circle-outline" : "image-outline"}
              size={32}
              color={post.urgent ? "#D92D20" : "#B45309"}
            />
          </View>
        )}

        <View style={{ padding: 12 }}>
          <Text numberOfLines={2} style={{ color: INK, fontSize: 14, fontFamily: "REM_BOLD" }}>
            {post.title}
          </Text>
          <Text style={{ color: INK, fontSize: 12, marginTop: 4, fontFamily: "REM_REGULAR" }}>
            {postedWhen(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <AnnouncementPreview post={open ? post : null} onClose={() => setOpen(false)} onDelete={onDelete} />
    </>
  );
}

/* ---------- event card: date badge, title + time, photo on the right ---------- */

export default function AnnouncementCard({
  post,
  onDelete,
  compact,
}: {
  post: Post;
  onDelete?: (p: Post) => void; // officials only: shows a Delete button in the preview
  compact?: boolean; // smaller version for lists like Home's Upcoming Events
}) {
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const img = announcementImageUrl(post.image_path);
  const badge = badgeFor(post);
  const isEvent = post.category === "Event";
  const showThumb = !!img && !thumbFailed;

  const size = compact
    ? { radius: 24, minH: 64, badge: 44, badgeRadius: 12, month: 10, day: 16, dayLine: 18, title: 14, sub: 12, thumb: 72, margin: 10, gap: 12 }
    : { radius: 32, minH: 96, badge: 64, badgeRadius: 18, month: 12, day: 24, dayLine: 28, title: 18, sub: 14, thumb: 110, margin: 16, gap: 16 };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: "#fff",
          borderRadius: size.radius,
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          minHeight: size.minH,
        }}
      >
        <View
          style={{
            marginVertical: size.margin,
            marginLeft: size.margin,
            width: size.badge,
            height: size.badge,
            borderRadius: size.badgeRadius,
            backgroundColor: "#FBC02D",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: INK, fontSize: size.month, fontFamily: "REM_REGULAR" }}>{badge.month}</Text>
          <Text style={{ color: INK, fontSize: size.day, lineHeight: size.dayLine, fontFamily: "REM_BOLD" }}>
            {badge.day}
          </Text>
        </View>

        <View style={{ flex: 1, marginLeft: size.gap, paddingVertical: 8, paddingRight: 12, gap: 2 }}>
          <Text numberOfLines={compact ? 1 : 2} style={{ color: INK, fontSize: size.title, fontFamily: "REM_BOLD" }}>
            {post.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ color: INK, fontSize: size.sub, fontFamily: "REM_REGULAR" }}>
              {isEvent && post.event_time ? post.event_time : post.category}
            </Text>
            {post.urgent && <Chip label="Urgent" bg="#FFC9B8" text="#7A1F00" />}
          </View>
        </View>

        {showThumb ? (
          <Image
            source={{ uri: img! }}
            style={{ width: size.thumb, alignSelf: "stretch", minHeight: size.minH, backgroundColor: "#FFE0B0" }}
            resizeMode="cover"
            onError={() => setThumbFailed(true)}
          />
        ) : null}
      </TouchableOpacity>

      <AnnouncementPreview post={open ? post : null} onClose={() => setOpen(false)} onDelete={onDelete} />
    </>
  );
}