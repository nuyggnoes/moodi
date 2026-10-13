"use client";

import { useEffect, type ReactNode } from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
};

/** 화면 왼쪽에서 슬라이드인되는 드로어. 배경(바깥) 탭이나 Esc 로 닫힌다. */
export function Drawer({ open, onClose, ariaLabel, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        data-testid="drawer-backdrop"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="drawer-in relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        {children}
      </div>
    </div>
  );
}
