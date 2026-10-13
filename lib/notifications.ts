import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export function useUnreadCount(userId: string | null) {
  const [count, setCount] = useState(0);
  const channelName = useRef(`unread-${Math.random().toString(36).slice(2)}`).current;

  const load = useCallback(async () => {
    if (!userId) return;
    const { count: c, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (!error) setCount(c ?? 0);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load, channelName]);

  return count;
}