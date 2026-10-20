import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { ProgressPhotoAsset } from "@/types";

export const ProgressPhotoDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  weight_kg: z.coerce.number().min(25).max(250).nullable().default(null),
  image_url: z.string(),
  storage_path: z.string().nullable().default(null),
  category: z.enum(["meal", "progress"]).default("progress"),
  notes: z.string().nullable().default(null),
});

export type ProgressPhotoDbRow = z.infer<typeof ProgressPhotoDbRowSchema>;

export function mapDbPhotoToDomain(row: ProgressPhotoDbRow): ProgressPhotoAsset {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    weightKg: row.weight_kg ?? 0,
    imageUrl: row.image_url,
    notes: row.notes || undefined,
    category: row.category,
  };
}

export const progressPhotosRepo = {
  async fetchPhotos(userId: string): Promise<ProgressPhotoAsset[]> {
    const { data, error } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false });

    if (error) {
      throw new Error(`[progressPhotosRepo] Error fetching progress photos: ${error.message}`);
    }

    return (data || []).map((row) => mapDbPhotoToDomain(ProgressPhotoDbRowSchema.parse(row)));
  },

  async createPhoto(userId: string, photo: Omit<ProgressPhotoAsset, "id">): Promise<ProgressPhotoAsset> {
    const payload = {
      user_id: userId,
      logged_date: photo.loggedDate,
      weight_kg: photo.weightKg || null,
      image_url: photo.imageUrl,
      category: photo.category || "progress",
      notes: photo.notes || null,
    };

    const { data, error } = await supabase
      .from("progress_photos")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[progressPhotosRepo] Error creating progress photo: ${error.message}`);
    }

    return mapDbPhotoToDomain(ProgressPhotoDbRowSchema.parse(data));
  },

  async deletePhoto(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("progress_photos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[progressPhotosRepo] Error deleting progress photo: ${error.message}`);
    }
  },
};
