import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { DiaryCalendar } from "@/features/diary/DiaryCalendar";

export default async function DiaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DiaryCalendar userId={user.id} />;
}
