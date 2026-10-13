"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { hidesNav } from "@/features/auth/protected-paths";
import { TopBar } from "./TopBar";

/** 로그인된 화면에 공통 상단바를 붙인다. 비로그인이거나 로그인·회원가입·프로필 설정 화면이면 붙이지 않는다. */
export function AppShell({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const showNav = userId !== null && !hidesNav(pathname);

  return (
    <>
      {showNav && <TopBar userId={userId} />}
      {children}
    </>
  );
}
