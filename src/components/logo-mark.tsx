import { useId } from "react";

/**
 * HP Lifts märke: en kabin på väg uppåt över ett berg, i en Skymningsblå ruta.
 * Färgerna kommer från temat (`primary` och `primary-foreground`), så märket
 * följer ljust och mörkt läge. Geometrin är densamma som i docs/logga/, där
 * filerna och reglerna för loggan finns. Dekorativt: namnet står bredvid.
 */
export function LogoMark({ className }: { className?: string }) {
  // Unikt id, eftersom sidomenyn och mobilens toppfält visar märket samtidigt.
  const clipId = useId();
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <clipPath id={clipId}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="64" height="64" className="fill-primary" />
        <g opacity={0.3}>
          <path
            d="M-6 70V60l56-33 18 14v29z"
            className="fill-primary-foreground stroke-primary-foreground"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
        <g className="stroke-primary-foreground" strokeWidth={3} strokeLinecap="round">
          <path d="M-4 34.2 68 6.8" />
          <path d="M32 20.5v5" />
        </g>
        <rect x="19" y="25" width="26" height="23" rx="5.5" className="fill-primary-foreground" />
        <rect x="22.5" y="29" width="19" height="8" rx="2.5" className="fill-primary" />
      </g>
    </svg>
  );
}
