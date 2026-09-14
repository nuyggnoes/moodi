"use client";

import { useRef, useState } from "react";
import type { Track } from "@/shared/lib/music/types";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PlayIcon, PauseIcon } from "@/shared/ui/icons";

export function TrackList({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  function togglePreview(track: Track) {
    const audio = audioRef.current;
    if (!audio || !track.previewUrl) return;

    if (playingId === track.trackId) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.previewUrl;
    audio.play();
    setPlayingId(track.trackId);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {tracks.map((track) => {
          const isPlaying = playingId === track.trackId;

          return (
            <li key={track.trackId}>
              <button
                type="button"
                onClick={() => togglePreview(track)}
                disabled={!track.previewUrl}
                aria-label={`${track.trackName} ${isPlaying ? "정지" : "재생"}`}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-hover disabled:cursor-default disabled:hover:bg-transparent"
                style={
                  isPlaying
                    ? {
                        background:
                          "radial-gradient(130% 160% at 0% 50%, color-mix(in srgb, var(--color-accent) 26%, transparent), transparent 68%), var(--color-surface)",
                      }
                    : undefined
                }
              >
                <AlbumArt src={track.albumArt} size={64} radius={10} />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span
                    className={`truncate text-[13.5px] font-medium ${isPlaying ? "text-accent" : "text-ink"}`}
                  >
                    {track.trackName}
                  </span>
                  <span className="truncate text-[11.5px] text-ink-dim">
                    {track.artist}
                  </span>
                </div>
                {track.previewUrl && (
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isPlaying
                        ? "bg-accent text-bg"
                        : "border border-border bg-surface text-ink-dim"
                    }`}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}
