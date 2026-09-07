"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * 앱 전역 클라이언트 프로바이더.
 *
 * `QueryClient` 를 `useState` 로 컴포넌트당 1회만 생성해 리렌더/HMR 시
 * 캐시가 초기화되지 않게 한다. RootLayout 은 서버 컴포넌트로 유지하고
 * 이 컴포넌트만 client boundary 로 분리한다.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
