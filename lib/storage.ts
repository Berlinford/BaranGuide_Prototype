import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

export const announcementImageUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from("announcements").getPublicUrl(path).data.publicUrl : null;

export const avatarUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl : null;

export async function uploadImage(bucket: string, path: string, fileUri: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You need to be logged in, with internet, to upload.");

  const res = await FileSystem.uploadAsync(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    fileUri,
    {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "image/jpeg",
        "x-upsert": "false",
      },
    }
  );

  if (res.status < 200 || res.status >= 300) {
    let msg = `Upload failed (${res.status})`;
    try {
      msg = JSON.parse(res.body).message ?? msg;
    } catch {}
    throw new Error(msg);
  }
}