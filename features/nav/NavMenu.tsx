"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { signOut } from "@/features/auth/actions";
import {
  CalendarIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
} from "@/shared/ui/icons";
import { NAV_ITEMS, isActiveNavItem } from "./nav-items";

const NAV_ICONS: Record<string, ReactNode> = {
  "/": <HomeIcon />,
  "/record": <PlusIcon />,
  "/diary": <CalendarIcon />,
  "/search": <SearchIcon />,
};

const ITEM_CLASS =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink-dim hover:bg-surface-hover rail:justify-center rail:px-0";

/**
 * 화면 이동 링크 + 로그아웃. 드로어와 사이드바가 함께 쓴다.
 * 사이드바가 레일로 접히면(`rail:` variant) 라벨만 숨기고 아이콘만 남긴다.
 */
export function NavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="주요 화면" className="flex flex-1 flex-col gap-1 border-t border-border pt-3">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActiveNavItem(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={cn(ITEM_CLASS, active && "bg-surface-hover font-medium text-ink")}
            >
              {NAV_ICONS[href]}
              <span className="whitespace-nowrap rail:hidden">{label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-border pt-3">
        <button
          type="submit"
          aria-label="로그아웃"
          title="로그아웃"
          className={cn(ITEM_CLASS, "w-full text-left")}
        >
          <LogoutIcon />
          <span className="whitespace-nowrap rail:hidden">로그아웃</span>
        </button>
      </form>
    </>
  );
}
