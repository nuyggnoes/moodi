import type { Database } from "@/shared/lib/supabase/database.types";

export type MusicRecord = Database["public"]["Tables"]["records"]["Row"];
