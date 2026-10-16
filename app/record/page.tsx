import { RecordForm } from "@/features/record/RecordForm";
import { getTodayRecord } from "@/features/record/getTodayRecord";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * `/record` — 기록하기. `?edit` 가 있고 오늘 기록이 있으면 그 값을 채워 수정 모드로 연다.
 * 오늘 기록이 없으면 쿼리와 상관없이 새 기록 화면이다. 수정은 항상 오늘 기록만 대상이다.
 */
export default async function RecordPage({ searchParams }: PageProps<"/record">) {
  const { edit } = await searchParams;

  let initialRecord = null;
  if (edit !== undefined) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) initialRecord = await getTodayRecord(supabase, user.id);
  }

  return <RecordForm initialRecord={initialRecord} />;
}
