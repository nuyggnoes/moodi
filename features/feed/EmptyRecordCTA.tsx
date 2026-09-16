import Link from "next/link";

/** 오늘 기록이 없을 때 화면을 지배하는 CTA. */
export function EmptyRecordCTA() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="max-w-[240px] text-xl font-semibold leading-snug text-ink">
        나의 오늘 감정을
        <br />
        노래와 함께 기록
      </p>
      <Link
        href="/record"
        className="rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-bg"
      >
        기록하기
      </Link>
    </div>
  );
}
