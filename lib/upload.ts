import { decode } from "base64-arraybuffer";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";

export async function uploadPhoto(bucket: string, path: string, uri: string) {
  const { base64 } = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!base64) throw new Error("Couldn't read the photo.");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: "image/jpeg" });
  if (error) throw error;
}