"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthActionState } from "./actions";
import { AUTH_ERROR_MESSAGES } from "./error-codes";

const initialState: AuthActionState = null;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

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
          minLength={6}
          autoComplete="new-password"
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
        {pending ? "가입 중..." : "회원가입"}
      </button>
      <p className="text-sm">
        이미 계정이 있으신가요? <Link href="/login">로그인</Link>
      </p>
    </form>
  );
}
