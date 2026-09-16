"use client";

import { useRef, useState } from "react";
import { useTodayFeed } from "./useTodayFeed";
import { FriendAvatarStrip } from "./FriendAvatarStrip";
import { TodayRecordCard } from "./TodayRecordCard";
import { EmptyRecordCTA } from "./EmptyRecordCTA";

/** `/` — 오늘 상태 기반 체크인 화면. 아바타 스트립은 상단 고정, 그 아래는 오늘 기록 여부로 갈린다. */
export function MainFeed({ userId }: { userId: string }) {
  const { data } = useTodayFeed(userId);
  const friends = data?.friends ?? [];
  const myRecord = data?.myRecord ?? null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function stopPlayback() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 p-4">
      {friends.length > 0 && (
        <FriendAvatarStrip friends={friends} onOpenPreview={stopPlayback} />
      )}

      {myRecord ? (
        <TodayRecordCard
          record={myRecord}
          audioRef={audioRef}
          isPlaying={isPlaying}
          onPlayingChange={setIsPlaying}
        />
      ) : (
        <EmptyRecordCTA />
      )}

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden />
    </div>
  );
}
