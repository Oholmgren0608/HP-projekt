import { useId } from "react";

/**
 * HP Topps märke (2026-11-20): en bergsklättrare i profil som frontar uppför
 * eggen på ett berg format efter K2, med en isyxa i varje hand, i en
 * Skymningsblå ruta. Berget har en skuggsida, en solsida och snö på toppen
 * och axeln. Färgerna kommer från temat (`primary` och `primary-foreground`),
 * så märket följer ljust och mörkt läge. Geometrin är densamma som i
 * docs/logga/, där filerna och reglerna för loggan finns.
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
        {/* K2: en avlägsen kedja, skuggsidan som hela berget, solsidan ovanpå, och snön på toppen och axeln. */}
        <g className="fill-primary-foreground">
          <path d="M-2 71V54L4 49.5L8.6 53L13 47.6L16.4 51.4L20 49.2L24 51.5L13.6 71z" opacity={0.14} />
          <path
            d="M13.6 71L35.4 30L37.6 27.6L41 20.4L45 12L48 15.4L51.2 19.6L53.6 23L57.2 24.4L61 26.2L63.4 28.6L67 34L72 42V71z"
            opacity={0.22}
          />
          <path d="M13.6 71L35.4 30L37.6 27.6L41 20.4L45 12L44.2 20L45 28L43.6 38L45.2 50L43.4 62L44 71z" opacity={0.16} />
          <path d="M45 12L48 15.4L50.4 18.4L48.4 18L47 20.4L45.6 18.6L44 20.6L42.6 18.8L41.8 18.6L44 14.2Z" opacity={0.85} />
          <path d="M53.6 23L57.2 24.4L61 26.2L63.4 28.6L60 28.4L56.6 27L54 26.6Z" opacity={0.85} />
        </g>
        {/* Klättraren, den bakre foten i origo: nedre yxan, bortre armen, benen med kängor och
            stegjärnens framtaggar, ryggsäck, bål, hjälm, den sträckta armen och övre yxan. */}
        <g
          transform="translate(19.5 60) scale(1.5)"
          className="stroke-primary-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <IceAxe transform="translate(6.6 -14.2) rotate(28)" />
          <path d="M3 -17.4 L3.4 -12.6 L6.6 -14.2" strokeWidth={1.6} />
          <path d="M0 -11 L-0.8 -5.8 L-1.8 -1.6" strokeWidth={2.4} />
          <path d="M-3.4 -0.6 L0.6 -0.9" strokeWidth={1.8} />
          <path d="M1.3 -0.8 L2.5 -0.7" strokeWidth={0.5} />
          <rect
            x="-2.6"
            y="-19"
            width="3.2"
            height="7.8"
            rx="1.1"
            transform="rotate(27 0.2 -15)"
            className="fill-primary-foreground"
            stroke="none"
          />
          <path d="M0.4 -11.4 L3.6 -17.8" strokeWidth={4.2} />
          <path d="M0.4 -10.8 L4.6 -10.4 L1.4 -6.4" strokeWidth={2.4} />
          <path d="M-0.2 -6 L3.6 -6.5" strokeWidth={1.8} />
          <path d="M4.3 -6.6 L5.5 -6.6" strokeWidth={0.5} />
          <circle cx="5" cy="-19.9" r="2" className="fill-primary-foreground" stroke="none" />
          {/* Hjälmens kant, i rutans färg. */}
          <path d="M2.9 -20.4 L7.3 -20.4" className="stroke-primary" strokeWidth={0.45} />
          <path d="M3.6 -17.6 L7 -20.8 L10.2 -23.6" strokeWidth={1.8} />
          <IceAxe transform="translate(10.2 -23.6) rotate(28)" />
        </g>
      </g>
    </svg>
  );
}

/** En isyxa: skaftet uppåt från greppet i origo, hackan böjd framåt mot berget. */
function IceAxe({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path d="M0 0.6 L0 -6.4" strokeWidth={0.9} />
      <path d="M-0.9 -6.6 L0.4 -6.8 Q2 -6.5 2.6 -4.6" strokeWidth={0.8} />
    </g>
  );
}
