import { supabase } from "./supabase";

export const announcementImageUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from("announcements").getPublicUrl(path).data.publicUrl : null;