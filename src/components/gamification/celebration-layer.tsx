"use client";

/**
 * Firarlager — konsumerar motorns notiser och visar:
 *  - Konfetti (canvas-confetti) vid level-up, achievements och streak
 *  - Level-up-modal när användaren når en ny nivå
 *  - Toasts för achievements, uppdrag och streak
 * Allt respekterar prefers-reduced-motion och spelar ljud om det är på.
 */

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { ACHIEVEMENTS, QUEST_POOL } from "@/lib/gamification/config";
import {
  consumeNotifications,
  subscribeGamification,
  type GameNotification,
} from "@/lib/gamification/engine";
import { play } from "@/lib/sound";

const PALETTE = ["#0d7c6f", "#2ba89a", "#f59e0b", "#f2604f", "#ffffff"];

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function burst(big: boolean) {
  if (reducedMotion()) return;
  confetti({
    particleCount: big ? 160 : 70,
    spread: big ? 100 : 70,
    startVelocity: big ? 42 : 30,
    gravity: 0.9,
    scalar: big ? 1.1 : 0.85,
    ticks: big ? 260 : 180,
    origin: { x: 0.5, y: 0.35 },
    colors: PALETTE,
    disableForReducedMotion: true,
    zIndex: 200,
  });
}

type Toast = {
  id: number;
  emoji: string;
  title: string;
  desc: string;
};

let toastId = 0;

export function CelebrationLayer() {
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tick, setTick] = useState(0);
  const queueRef = useRef<GameNotification[]>([]);
  const busyRef = useRef(false);

  useEffect(() => {
    return subscribeGamification(() => {
      const incoming = consumeNotifications();
      if (incoming.length === 0) return;
      queueRef.current.push(...incoming);
      // Trigger en render så att kön faktiskt processas.
      setTick((t) => t + 1);
    });
  }, []);

  // Processa kön sekventiellt — level-up-modalen väntar på sin tur.
  useEffect(() => {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    busyRef.current = true;
    const showToast = (t: Omit<Toast, "id">) => {
      setToasts((prev) => [...prev.slice(-2), { ...t, id: ++toastId }]);
    };

    const finish = () => {
      busyRef.current = false;
    };

    switch (next.kind) {
      case "levelup": {
        burst(true);
        play("levelup");
        setLevelUp({ level: next.level, title: next.title });
        // Modal stänger sig själv; kön fortsätter när den stängs.
        break;
      }
      case "achievement": {
        const def = ACHIEVEMENTS.find((a) => a.id === next.id);
        if (def) {
          burst(false);
          play("achievement");
          showToast({ emoji: def.emoji, title: `Achievement: ${def.title}`, desc: def.desc });
        }
        finish();
        break;
      }
      case "questdone": {
        const def = QUEST_POOL.find((q) => q.id === next.questId);
        if (def) {
          play("questdone");
          showToast({
            emoji: def.emoji,
            title: "Uppdrag klart!",
            desc: `${def.label} · +${def.xp} XP`,
          });
        }
        finish();
        break;
      }
      case "streak": {
        play("streak");
        showToast({
          emoji: "🔥",
          title: `${next.count} dagar i rad!`,
          desc: "Din streak växer — fortsätt så!",
        });
        finish();
        break;
      }
      default:
        finish();
    }
  }, [tick, toasts, levelUp]);

  const closeLevelUp = () => {
    setLevelUp(null);
    busyRef.current = false;
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Level-up-modal */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            key="levelup"
            className="fixed inset-0 z-[150] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm"
              onClick={closeLevelUp}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Nivå upp: ${levelUp.title}`}
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="relative w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-pop"
            >
              <p className="text-sm font-extrabold tracking-widest text-[var(--energy)] uppercase">
                Nivå upp!
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">
                Nivå {levelUp.level}
              </h2>
              <p className="mt-1 text-lg font-bold text-[var(--brand)]">{levelUp.title}</p>
              <button
                type="button"
                onClick={closeLevelUp}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2.5 text-base font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fortsätt plugga 🎉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[140] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
              onAnimationComplete={() => {
                window.setTimeout(() => dismissToast(t.id), 4000);
              }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3.5 text-left shadow-pop"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
                {t.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-[var(--ink)]">{t.title}</span>
                <span className="block truncate text-xs font-semibold text-[var(--ink-muted)]">{t.desc}</span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
