"use client";

import { useEffect, useRef, useState } from "react";
import { countdownWarning, type CountdownWarning } from "@/lib/countdown";

/**
 * Räknar ned mot en deadline medan quizet pågår och anropar `onExpire` exakt en
 * gång när tiden tar slut. Delas av nivåtestet, övningen och provpasset så att
 * tick, varningar och avslut beter sig likadant i alla tidsatta lägen.
 *
 * Klockan uppdateras bara inifrån timers (aldrig synkront i en effekt eller
 * under render), och första ticket sker direkt så att en ny omgång visar rätt
 * tid utan att vänta en sekund.
 */
export function useQuizCountdown({
  deadline,
  active,
  onExpire,
}: {
  /** Tidpunkten då tiden tar slut, eller null för att köra utan tidsgräns. */
  deadline: number | null;
  /** Tickar bara medan quizet pågår (inte i intro-/genomgångslägen). */
  active: boolean;
  onExpire: () => void;
}): { remainingSeconds: number | null; warning: CountdownWarning } {
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Senaste callbacken — effekterna nedan ska inte bero på dess identitet.
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // Ny deadline = ny omgång: öppna spärren igen.
  useEffect(() => {
    expiredRef.current = false;
  }, [deadline]);

  useEffect(() => {
    if (!active || deadline === null) return;
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [active, deadline]);

  const remainingSeconds =
    deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (!active || remainingSeconds === null || remainingSeconds > 0) return;
    if (expiredRef.current) return;
    expiredRef.current = true;
    onExpireRef.current();
  }, [active, remainingSeconds]);

  return { remainingSeconds, warning: countdownWarning(remainingSeconds) };
}
