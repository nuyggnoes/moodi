"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { hidesNav } from "@/features/auth/protected-paths";
import { RightPanelProvider, RightPanelSlot } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/**
 * 로그인된 화면에 공통 내비게이션을 붙인다.
 * - 761px 이상: 상단바 없이 좌측 사이드바 | 본문 | 우측 패널 슬롯 (슬롯은 비면 숨김)
 * - 760px 이하: 상단바 + 드로어
 * 비로그인이거나 로그인·회원가입·프로필 설정 화면이면 아무것도 붙이지 않는다.
 * 어느 쪽을 보일지는 CSS 가 정하므로 서버 렌더링 후 깜빡임이 없다.
 */
export function AppShell({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const showNav = userId !== null && !hidesNav(pathname);

  if (!showNav) return <>{children}</>;

  return (
    <RightPanelProvider>
      <TopBar userId={userId} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden min-[761px]:block">
          <Sidebar userId={userId} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <RightPanelSlot />
      </div>
    </RightPanelProvider>
  );
}
