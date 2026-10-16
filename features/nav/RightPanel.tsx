"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const RightPanelContext = createContext<HTMLElement | null>(null);
const SetSlotContext = createContext<(el: HTMLElement | null) => void>(() => {});

/**
 * 우측 패널 슬롯의 DOM 요소를 들고 있다가, 페이지의 `<RightPanel>` 이 그리로 내용을 보낼 수 있게 한다.
 * 레이아웃(AppShell)과 페이지는 부모-자식이 아니라서, 컨텍스트로 "자리"를 알려주고 포털로 내용을 옮긴다.
 */
export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <SetSlotContext.Provider value={setSlot}>
      <RightPanelContext.Provider value={slot}>{children}</RightPanelContext.Provider>
    </SetSlotContext.Provider>
  );
}

/**
 * 셸의 우측 열. 내용이 없으면(`:empty`) 열 자체를 숨긴다.
 * 1100px 이하에서는 패널이 숨겨지고, 그 폭의 대체 표시는 페이지가 맡는다.
 */
export function RightPanelSlot() {
  const setSlot = useContext(SetSlotContext);

  return (
    <div className="hidden min-[1101px]:block">
      <aside
        ref={setSlot}
        aria-label="보조 패널"
        className="sticky top-0 max-h-screen w-[320px] shrink-0 self-start overflow-y-auto border-l border-border p-4 empty:hidden"
      />
    </div>
  );
}

/** 페이지가 우측 패널에 보여줄 내용을 선언한다. 슬롯이 없는 화면(로그인 등)에서는 아무것도 그리지 않는다. */
export function RightPanel({ children }: { children: ReactNode }) {
  const slot = useContext(RightPanelContext);
  if (!slot) return null;
  return createPortal(children, slot);
}
