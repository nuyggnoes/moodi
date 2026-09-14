"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthActionState } from "./actions";
import { AUTH_ERROR_MESSAGES } from "./error-codes";

const initialState: AuthActionState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border px-3 py-2"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {AUTH_ERROR_MESSAGES[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-sm">
        계정이 없으신가요? <Link href="/signup">회원가입</Link>
      </p>
    </form>
  );
}
