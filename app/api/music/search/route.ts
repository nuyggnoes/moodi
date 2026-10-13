import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { itunesProvider } from "@/shared/lib/music/itunes";

export async function GET(request: NextRequest) {
  // proxy.ts 도 /api 를 막지만 최종 권한 확인은 route 에서 한 번 더 한다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await itunesProvider.search(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "upstream_error" },
      { status: 502 },
    );
  }
}
