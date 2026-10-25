"use client";

/**
 * Firarlager — konsumerar motorns notiser och visar:
 *  - Level-up-modal när användaren når en ny nivå
 *  - Toasts för achievements, uppdrag och streak
 * Allt respekterar prefers-reduced-motion och spelar ljud om det är på.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ACHIEVEMENTS, QUEST_POOL } from "@/lib/gamification/config";
import {
  consumeNotifications,
  subscribeGamification,
  type GameNotification,
} from "@/lib/gamification/engine";
import { Check } from "lucide-react";
import { play } from "@/lib/sound";

type Toast = {
  id: number;
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
        play("levelup");
        setLevelUp({ level: next.level, title: next.title });
        // Modal stänger sig själv; kön fortsätter när den stängs.
        break;
      }
      case "achievement": {
        const def = ACHIEVEMENTS.find((a) => a.id === next.id);
        if (def) {
          play("achievement");
          showToast({ title: `Prestation: ${def.title}`, desc: def.desc });
        }
        finish();
        break;
      }
      case "questdone": {
        const def = QUEST_POOL.find((q) => q.id === next.questId);
        if (def) {
          play("questdone");
          showToast({
            title: "Uppdrag klart",
            desc: `${def.label} · +${def.xp} XP`,
          });
        }
        finish();
        break;
      }
      case "streak": {
        play("streak");
        showToast({
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
              className="absolute inset-0 bg-[var(--ink)]/40"
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
              className="relative w-full max-w-sm rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-pop"
            >
              <p className="text-[13px] font-medium text-[var(--ink-muted)]">
                Nivå upp!
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)]">
                Nivå {levelUp.level}
              </h2>
              <p className="mt-1 text-lg font-semibold text-[var(--brand)]">{levelUp.title}</p>
              <button
                type="button"
                onClick={closeLevelUp}
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[var(--brand)] px-4 py-2.5 text-base font-medium text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fortsätt plugga
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[140] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:items-end md:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onAnimationComplete={() => {
                window.setTimeout(() => dismissToast(t.id), 4000);
              }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--card)] p-3.5 text-left shadow-pop"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
                <Check className="size-5 text-[var(--brand)]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--ink)]">{t.title}</span>
                <span className="block truncate text-xs font-medium text-[var(--ink-muted)]">{t.desc}</span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
