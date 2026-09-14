"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileActionState } from "./actions";
import { PROFILE_ERROR_MESSAGES } from "./error-codes";

const initialState: ProfileActionState = null;

export function ProfileSetupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1">
        <label htmlFor="nickname" className="text-ink-dim">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          maxLength={20}
          autoComplete="nickname"
          className="rounded border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="avatar" className="text-ink-dim">
          프로필 이미지 (선택)
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="rounded border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-error">
          {PROFILE_ERROR_MESSAGES[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 text-bg disabled:opacity-50"
      >
        {pending ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
