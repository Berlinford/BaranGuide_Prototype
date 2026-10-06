import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/* ---------- READ: show the saved copy first, then refresh ---------- */
export function useCached<T>(key: string | null, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    if (!key) return;
    try {
      const fresh = await fetcher();
      setData(fresh);
      setOffline(false);
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(fresh));
    } catch (e) {
        setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    (async () => {
      const raw = await AsyncStorage.getItem(`cache:${key}`);
      if (raw) {
        setData(JSON.parse(raw));
        setLoading(false);
      }
      refresh();
    })();
  }, [key]);

  return { data, loading, offline, refresh };
}

/* ---------- WRITE: send now, or queue only if the network is down ---------- */
type Job = { table: string; row: Record<string, any> };

// Postgres/PostgREST errors have a `code`. Network failures don't.
const isNetworkError = (e: any) => !e?.code;

export async function submit(table: string, row: Record<string, any>) {
  const full = { id: Crypto.randomUUID(), ...row };
  const { error } = await supabase
    .from(table)
    .upsert(full, { onConflict: "id", ignoreDuplicates: true });

  if (!error) return { queued: false as const, error: null };
  if (!isNetworkError(error)) return { queued: false as const, error }; // real rejection

  const raw = await AsyncStorage.getItem("queue");
  const queue: Job[] = raw ? JSON.parse(raw) : [];
  queue.push({ table, row: full });
  await AsyncStorage.setItem("queue", JSON.stringify(queue));
  return { queued: true as const, error: null };
}

let flushing = false;
export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const raw = await AsyncStorage.getItem("queue");
    const queue: Job[] = raw ? JSON.parse(raw) : [];
    if (!queue.length) return;

    const left: Job[] = [];
    for (const job of queue) {
      const { error } = await supabase
        .from(job.table)
        .upsert(job.row, { onConflict: "id", ignoreDuplicates: true });
      if (error && isNetworkError(error)) left.push(job); // still offline: keep
      // success or a real server rejection: drop it, so it can't retry forever
    }
    await AsyncStorage.setItem("queue", JSON.stringify(left));
  } finally {
    flushing = false;
  }
}

export const startSync = () =>
  NetInfo.addEventListener((s) => {
    if (s.isConnected) flushQueue();
  });