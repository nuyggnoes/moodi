import { createClient } from "@/shared/lib/supabase/server";
import { LoginForm } from "@/features/auth/LoginForm";
import { LogoutButton } from "@/features/auth/LogoutButton";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {user ? <LogoutButton email={user.email ?? ""} /> : <LoginForm />}
      </div>
    </div>
  );
}
