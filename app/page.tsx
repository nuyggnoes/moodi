import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { HomeView } from "@/features/home/HomeView";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <HomeView userId={user.id} />;
}
