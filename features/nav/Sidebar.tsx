"use client";

import Link from "next/link";
import { useState } from "react";
import { SidebarToggleIcon } from "@/shared/ui/icons";
import { Avatar } from "@/shared/ui/Avatar";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { useUserProfile } from "@/entities/user/useUserProfile";
import { NavMenu } from "./NavMenu";
import { isRail, toggleMode, type CollapseMode } from "./sidebarState";

/** 이 폭 이하에서는 사이드바가 자동으로 레일(아이콘만)로 접힌다. CSS 의 `rail` variant 와 같은 값. */
const NARROW_QUERY = "(max-width: 1100px)";

/**
 * 데스크톱 좌측 사이드바: 워드마크 + 접기 버튼, 내 정보, 메뉴, 로그아웃.
 * 접힘은 `data-collapsed` 와 CSS 로 처리해 서버 렌더링 후 깜빡임이 없다.
 * 폭 경계(1100px)를 넘으면 수동 토글을 풀고 자동(auto)으로 돌아간다.
 */
export function Sidebar({ userId }: { userId: string }) {
  const { data: profile } = useUserProfile(userId);
  const narrow = useMediaQuery(NARROW_QUERY);
  // 수동 선택은 그 시점의 폭 구간(narrow)과 함께 저장한다. 구간이 바뀌면 자동으로 무효가 되어 auto 로 돌아간다.
  const [choice, setChoice] = useState<{ mode: CollapseMode; narrow: boolean }>({
    mode: "auto",
    narrow: false,
  });
  const mode = choice.narrow === narrow ? choice.mode : "auto";

  const rail = isRail(mode, narrow);

  return (
    <aside
      aria-label="메뉴"
      data-collapsed={mode}
      className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-1.5 self-start overflow-hidden border-r border-border bg-surface/70 px-3.5 pb-5 pt-3 transition-[width] duration-200 motion-reduce:transition-none rail:w-[72px]"
    >
      <div className="mb-2 flex h-11 items-center justify-between pl-2 rail:justify-center rail:pl-0">
        <Link href="/" aria-label="Moodi 홈" className="text-lg font-semibold tracking-tight text-ink rail:hidden">
          Moodi
        </Link>
        <button
          type="button"
          onClick={() => setChoice({ mode: toggleMode(mode, narrow), narrow })}
          aria-label="사이드바 접기/펼치기"
          aria-expanded={!rail}
          className="rounded-full p-2 text-ink-dim hover:bg-surface-hover hover:text-ink"
        >
          <SidebarToggleIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 px-2 pb-4 rail:justify-center rail:px-0">
        <Avatar src={profile?.avatar_url ?? null} alt="내 아바타" size={44} />
        <p className="truncate font-medium text-ink rail:hidden">{profile?.nickname ?? ""}</p>
      </div>

      <NavMenu />
    </aside>
  );
}
