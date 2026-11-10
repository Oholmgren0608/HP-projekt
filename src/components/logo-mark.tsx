import { useId } from "react";

/**
 * HP Lifts märke: en vandrare med ryggsäck och stav på väg uppför ett berg med
 * glaciär, i en Skymningsblå ruta. Färgerna kommer från temat (`primary` och
 * `primary-foreground`), så märket följer ljust och mörkt läge. Geometrin är
 * densamma som i docs/logga/, där filerna och reglerna för loggan finns.
 * Dekorativt: namnet står bredvid.
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
          <path d="M-6 70V50l7-4 6 5 6-8 5 4 25-26 4 6 3-3 16 18V70z" className="fill-primary-foreground" />
        </g>
        {/* Glaciären på toppen. */}
        <path
          d="M43 21 L47.4 27.6 L45.2 26.6 L43.4 29 L41.4 27 L39.2 28.4 Z"
          className="fill-primary-foreground"
          opacity={0.85}
        />
        {/* Vandraren i profil, fötterna i origo: ben i steg, kängor, framåtlutad kropp, stav, ryggsäck och huvud. */}
        <g
          transform="translate(21 60) scale(1.5)"
          className="stroke-primary-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M-0.5 -13 L-5 -0.8" strokeWidth={3.2} />
          <path d="M0.6 -13 L5 -8.2 L5.2 -3.6" strokeWidth={3.2} />
          <path d="M-6 -0.6 h3.6" strokeWidth={2.2} />
          <path d="M4.6 -3.4 h3.4" strokeWidth={2.2} />
          <path d="M0 -13.5 L3 -22.5" strokeWidth={5.2} />
          <path d="M7.6 -17 L10.8 -3" strokeWidth={1.1} />
          <path d="M3.4 -21.5 L7.6 -16.6" strokeWidth={2.2} />
          <rect
            x="-6.4"
            y="-25.2"
            width="6.2"
            height="11.6"
            rx="2.2"
            transform="rotate(18 -3.3 -19.4)"
            className="fill-primary-foreground"
            stroke="none"
          />
          <circle cx="4.6" cy="-26.6" r="2.9" className="fill-primary-foreground" stroke="none" />
        </g>
      </g>
    </svg>
  );
}
