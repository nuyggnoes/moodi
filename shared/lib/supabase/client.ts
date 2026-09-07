import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 *
 * 클라이언트 인스턴스를 모듈 로드 시점이 아니라 호출 시점에 생성한다.
 * `NEXT_PUBLIC_SUPABASE_*` 가 없는 환경(예: CI `next build`)에서도
 * 모듈 import 만으로는 throw 하지 않게 하기 위함.
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from("records").select();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
