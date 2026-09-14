import { signOut } from "./actions";

export function LogoutButton({ email }: { email: string }) {
  return (
    <form action={signOut} className="flex flex-col gap-3">
      <p className="text-sm">{email}로 로그인되어 있어요.</p>
      <button
        type="submit"
        className="rounded border px-4 py-2 hover:bg-black/[.04]"
      >
        로그아웃
      </button>
    </form>
  );
}
