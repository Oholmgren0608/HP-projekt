import { useEffect, useRef, useState } from "react";
import {
  clearPracticeTimer,
  loadOrStartPracticeSession,
  loadPracticeTimer,
  savePausedPracticeTimer,
  savePracticeTimer,
  type PracticeTimerState,
} from "@/lib/practice-timer";

export function usePausablePracticeTimer(week: number, taskId: string, requiredMinutes: number) {
  const requiredMs = requiredMinutes * 60 * 1000;

  const [session, setSession] = useState<PracticeTimerState>(() =>
    loadOrStartPracticeSession(week, taskId),
  );
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);

  const sessionRef = useRef(session);
  const runningSinceRef = useRef(runningSince);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  function persist(next: PracticeTimerState) {
    const stored = loadPracticeTimer(week, taskId);
    if (!stored || stored.attemptId === next.attemptId) {
      savePracticeTimer(week, taskId, next);
    }
    setSession(next);
    sessionRef.current = next;
  }

  function pause(reason: "leave" | "hidden" = "leave") {
    const since = runningSinceRef.current;
    if (since === null) {
      setPaused(true);
      return sessionRef.current;
    }
    const extraMs = Math.max(0, Date.now() - since);
    runningSinceRef.current = null;
    setRunningSince(null);
    setPaused(true);
    const { saved, replacedByNewerAttempt } = savePausedPracticeTimer(
      week,
      taskId,
      sessionRef.current,
      extraMs,
    );
    if (!replacedByNewerAttempt) {
      setSession(saved);
      sessionRef.current = saved;
    }
    void reason;
    return replacedByNewerAttempt ? sessionRef.current : saved;
  }

  function markQuizComplete() {
    const next: PracticeTimerState = { ...sessionRef.current, quizComplete: true };
    persist(next);
  }

  function resume() {
    if (runningSinceRef.current !== null) {
      setPaused(false);
      return;
    }
    const t = Date.now();
    runningSinceRef.current = t;
    setRunningSince(t);
    setPaused(false);
    setNow(t);
  }

  useEffect(() => {
    if (runningSince === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningSince]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause("hidden");
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) resume();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause("leave");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, taskId]);

  const elapsedMs =
    session.accumulatedMs +
    (runningSince !== null ? Math.max(0, now - runningSince) : 0);
  const remainingMs = Math.max(0, requiredMs - elapsedMs);
  const ready = remainingMs <= 0;
  const progress = Math.min(100, Math.round((elapsedMs / requiredMs) * 100));

  return {
    ready,
    paused,
    attemptId: session.attemptId,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progress,
    requiredMinutes,
    pause,
    markQuizComplete,
    clear: () => clearPracticeTimer(week, taskId),
  };
}
