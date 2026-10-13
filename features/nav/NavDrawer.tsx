"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@/shared/ui/Drawer";
import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/lib/cn";
import { signOut } from "@/features/auth/actions";
import { NAV_ITEMS, isActiveNavItem } from "./nav-items";

type NavDrawerProps = {
  open: boolean;
  onClose: () => void;
  nickname: string | null;
  avatarUrl: string | null;
};

/** 좌측 드로어: 내 정보, 화면 이동 리스트, 로그아웃. 링크를 누르면 닫힌다. */
export function NavDrawer({ open, onClose, nickname, avatarUrl }: NavDrawerProps) {
  const pathname = usePathname();

  return (
    <Drawer open={open} onClose={onClose} ariaLabel="메뉴">
      <div className="flex items-center gap-3 pb-4">
        <Avatar src={avatarUrl} alt="내 아바타" size={44} />
        <p className="truncate font-medium text-ink">{nickname ?? ""}</p>
      </div>

      <nav aria-label="주요 화면" className="flex flex-1 flex-col gap-1 border-t border-border pt-3">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActiveNavItem(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2.5 text-ink-dim hover:bg-surface-hover",
                active && "bg-surface-hover font-medium text-ink",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-border pt-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2.5 text-left text-ink-dim hover:bg-surface-hover"
        >
          로그아웃
        </button>
      </form>
    </Drawer>
  );
}
