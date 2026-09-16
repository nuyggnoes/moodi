"use client";

import type { ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
};

/** 화면 하단에서 올라오는 시트. 배경(바깥) 탭으로 닫힌다. */
export function BottomSheet({ open, onClose, ariaLabel, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        data-testid="bottom-sheet-backdrop"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative w-full max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        {children}
      </div>
    </div>
  );
}
