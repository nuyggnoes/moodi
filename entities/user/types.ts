import type { Database } from "@/shared/lib/supabase/database.types";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
