import { NextRequest, NextResponse } from "next/server";
import { itunesProvider } from "@/shared/lib/music/itunes";

export async function GET(request: NextRequest) {
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
