import { SignupForm } from "@/features/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
