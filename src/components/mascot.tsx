"use client";

/**
 * Maskoten "Ugglan" — en CSS/SVG-uggla utan bildtillgångar.
 * Reagerar på stämningsläget: blinkar i vila, firar med upphöjda vingar,
 * somnar med Zzz och tittar uppfordrande vid nudge.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type MascotMood = "idle" | "happy" | "celebrate" | "sleep" | "nudge" | "sad";

export function Mascot({
  mood = "idle",
  className,
  float = true,
}: {
  mood?: MascotMood;
  className?: string;
  float?: boolean;
}) {
  const celebrating = mood === "celebrate";
  const sleeping = mood === "sleep";
  const happy = mood === "happy" || mood === "celebrate";
  const closedEyes = sleeping || mood === "celebrate";
  const sad = mood === "sad";

  return (
    <div
      className={cn("relative inline-block", float && !sleeping && "animate-float", className)}
      aria-hidden
    >
      <svg viewBox="0 0 120 120" className="size-full drop-shadow-[0_6px_12px_rgb(20_48_44/0.18)]">
        {/* Vingar */}
        <motion.g
          animate={
            celebrating
              ? { rotate: [0, -18, -12], y: [0, -6, -4] }
              : sleeping
                ? { rotate: 0, y: 0 }
                : { rotate: 0, y: 0 }
          }
          transition={celebrating ? { duration: 0.7, repeat: Infinity, repeatType: "reverse" } : undefined}
          style={{ originX: "62px", originY: "58px" }}
        >
          <path
            d="M14 62c-6-14 6-24 16-18 8 5 10 16 8 26-6-2-18-2-24-8Z"
            fill="var(--ink-soft)"
            opacity="0.9"
          />
        </motion.g>
        <motion.g
          animate={
            celebrating
              ? { rotate: [0, 18, 12], y: [0, -6, -4] }
              : sleeping
                ? { rotate: 0, y: 0 }
                : { rotate: 0, y: 0 }
          }
          transition={celebrating ? { duration: 0.7, repeat: Infinity, repeatType: "reverse" } : undefined}
          style={{ originX: "58px", originY: "58px" }}
        >
          <path
            d="M106 62c6-14-6-24-16-18-8 5-10 16-8 26 6-2 18-2 24-8Z"
            fill="var(--ink-soft)"
            opacity="0.9"
          />
        </motion.g>

        {/* Örontofsar */}
        <path d="M38 22 30 6l14 8Z" fill="var(--brand)" />
        <path d="M82 22 90 6 76 14Z" fill="var(--brand)" />

        {/* Kropp */}
        <ellipse cx="60" cy="66" rx="42" ry="46" fill="var(--brand)" />
        {/* Mage */}
        <ellipse cx="60" cy="76" rx="26" ry="30" fill="var(--accent-soft)" />

        {/* Ögon */}
        <circle cx="45" cy="52" r="13.5" fill="var(--card, #fff)" />
        <circle cx="75" cy="52" r="13.5" fill="var(--card, #fff)" />

        {closedEyes ? (
          /* Stängda (lyckliga) ögon */
          <>
            <path d="M36 53q9 6 18 0" stroke="var(--ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M66 53q9 6 18 0" stroke="var(--ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Pupiller */}
            <motion.circle
              cx="45"
              cy="53"
              r={sad ? 4.6 : 6.2}
              fill="var(--ink)"
              animate={
                mood === "nudge"
                  ? { y: [0, 2.4, -2.4, 0] }
                  : sleeping
                    ? { y: [0, 3, 0] }
                    : {}
              }
              transition={
                mood === "nudge" ? { duration: 0.5, repeat: 3 } : sleeping ? { duration: 1.4, repeat: Infinity } : undefined
              }
            />
            <motion.circle
              cx="75"
              cy="53"
              r={sad ? 4.6 : 6.2}
              fill="var(--ink)"
              animate={
                mood === "nudge"
                  ? { y: [0, -2.4, 2.4, 0] }
                  : sleeping
                    ? { y: [0, 3, 0] }
                    : {}
              }
              transition={
                mood === "nudge" ? { duration: 0.5, repeat: 3 } : sleeping ? { duration: 1.4, repeat: Infinity } : undefined
              }
            />
            {/* Glimt i ögonen */}
            <circle cx="42.6" cy="50" r="2" fill="#fff" opacity="0.9" />
            <circle cx="72.6" cy="50" r="2" fill="#fff" opacity="0.9" />
          </>
        )}

        {/* Blinklock (bara när ögonen är öppna) */}
        {!closedEyes && (
          <motion.g
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            transition={{ duration: 4.2, times: [0, 0.9, 0.95, 1, 1], repeat: Infinity, repeatDelay: 0.5 }}
            style={{ originX: "60px", originY: "52px" }}
          >
            <path d="M31.5 52h27M61.5 52h27" stroke="var(--brand)" strokeWidth="13.5" strokeLinecap="round" opacity="0.001" />
          </motion.g>
        )}

        {/* Ögonbryn */}
        {mood === "nudge" && (
          <>
            <path d="M36 36l14-4" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            <path d="M84 36 70 32" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {sad && (
          <>
            <path d="M37 40l13 2" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            <path d="M83 40 70 42" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* Näbb */}
        <path
          d="M60 60l7 6.5-7 6.5-7-6.5Z"
          fill="var(--energy)"
          transform={sad ? "translate(0 4) rotate(180 60 66)" : happy ? "translate(0 -1)" : ""}
        />

        {/* Mun — glatt leende när happy/celebrate */}
        {happy && <path d="M52 76q8 6 16 0" stroke="var(--ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />}

        {/* Kinder */}
        {happy && (
          <>
            <circle cx="32" cy="66" r="5" fill="var(--coral)" opacity="0.55" />
            <circle cx="88" cy="66" r="5" fill="var(--coral)" opacity="0.55" />
          </>
        )}

        {/* Fötter */}
        <ellipse cx="48" cy="110" rx="9" ry="5" fill="var(--energy)" />
        <ellipse cx="72" cy="110" rx="9" ry="5" fill="var(--energy)" />
      </svg>

      {/* Zzz när den sover */}
      {sleeping && (
        <div className="pointer-events-none absolute -top-2 right-0 text-lg font-extrabold text-[var(--ink-soft)]">
          <motion.span
            className="absolute right-0 top-0"
            animate={{ opacity: [0, 1, 0], y: [-4, -16, -26] }}
            transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.4, 1] }}
          >
            Z
          </motion.span>
          <motion.span
            className="absolute right-4 top-2"
            animate={{ opacity: [0, 1, 0], y: [-4, -16, -26] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.6, times: [0, 0.4, 1] }}
          >
            z
          </motion.span>
        </div>
      )}

      {/* Glittrar när den firar */}
      {celebrating && (
        <div className="pointer-events-none absolute inset-0">
          {[
            { left: "4%", top: "14%", delay: 0 },
            { left: "88%", top: "8%", delay: 0.35 },
            { left: "92%", top: "60%", delay: 0.7 },
          ].map((s, i) => (
            <motion.span
              key={i}
              className="absolute text-base leading-none"
              style={{ left: s.left, top: s.top }}
              animate={{ scale: [0, 1.15, 0], rotate: [0, 60, 120], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: s.delay }}
            >
              ✦
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
