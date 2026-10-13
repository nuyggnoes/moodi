"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon } from "@/shared/ui/icons";
import { Avatar } from "@/shared/ui/Avatar";
import { useUserProfile } from "@/entities/user/useUserProfile";
import { NavDrawer } from "./NavDrawer";

/** 상단 고정 바: 햄버거(드로어), "Moodi" 워드마크(홈), 내 아바타. */
export function TopBar({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const { data: profile } = useUserProfile(userId);

  const nickname = profile?.nickname ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="mx-auto flex h-14 w-full max-w-[480px] items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
            className="-ml-2 rounded-full p-2 text-ink hover:bg-surface-hover"
          >
            <MenuIcon />
          </button>
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
            Moodi
          </Link>
          <Avatar src={avatarUrl} alt="내 아바타" size={32} />
        </div>
      </header>

      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        nickname={nickname}
        avatarUrl={avatarUrl}
      />
    </>
  );
}
