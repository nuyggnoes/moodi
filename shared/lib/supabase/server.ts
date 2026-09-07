import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버(서버 컴포넌트 · Route Handler · 미들웨어)용 Supabase 클라이언트.
 *
 * 요청별 쿠키에 세션을 읽고 쓰기 위해 `next/headers` 의 `cookies()` 와 연동한다.
 * 서버 컴포넌트에서 호출될 때는 쿠키 쓰기가 불가능하므로 `setAll` 을 try/catch 로
 * 감싼다 — 세션 갱신은 미들웨어(#7)에서 처리한다.
 *
 * @example
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서 호출된 경우. 미들웨어가 세션을 갱신하면 무시 가능.
          }
        },
      },
    },
  );
}
