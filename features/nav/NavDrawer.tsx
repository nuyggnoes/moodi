"use client";

import { Drawer } from "@/shared/ui/Drawer";
import { Avatar } from "@/shared/ui/Avatar";
import { NavMenu } from "./NavMenu";

type NavDrawerProps = {
  open: boolean;
  onClose: () => void;
  nickname: string | null;
  avatarUrl: string | null;
};

/** 좌측 드로어: 내 정보, 화면 이동 리스트, 로그아웃. 링크를 누르면 닫힌다. */
export function NavDrawer({ open, onClose, nickname, avatarUrl }: NavDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} ariaLabel="메뉴">
      <div className="flex items-center gap-3 pb-4">
        <Avatar src={avatarUrl} alt="내 아바타" size={44} />
        <p className="truncate font-medium text-ink">{nickname ?? ""}</p>
      </div>

      <NavMenu onNavigate={onClose} />
    </Drawer>
  );
}
