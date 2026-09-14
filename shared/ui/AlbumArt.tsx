type AlbumArtProps = {
  src: string | null;
  alt?: string;
  size?: number;
  radius?: number;
};

/** 앨범 아트. `src`가 없으면 accent 계열 그라디언트 placeholder를 보여준다. */
export function AlbumArt({ src, alt = "", size = 64, radius = 10 }: AlbumArtProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 도메인, next/image 설정은 실제 배포 트래픽 보고 별도 이슈에서 검토
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="shrink-0 object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-accent) 35%, var(--color-surface)), var(--color-border))",
      }}
    />
  );
}
