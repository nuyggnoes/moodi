import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { getUserProfile } from "@/entities/user/queries";
import { ProfileSetupForm } from "@/features/profile-setup/ProfileSetupForm";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  if (profile) {
    redirect("/");
  }

  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <ProfileSetupForm next={next ?? "/"} />
      </div>
    </div>
  );
}
