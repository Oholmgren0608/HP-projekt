/**
 * Ljudmotor — opt-in, helt syntetiserad med WebAudio (inga ljudfiler).
 *
 * Allt spelas genom små oscillator-baserade melodier: korrekt svar, fel
 * svar, level-up-fanfar, streak-trin, achievements m.m. Ljud är avstängt
 * som standard (hp-lift-sound = "0") och AudioContext skapas först vid
 * första användarinteraktion (webbläsarkrav).
 */

export type SoundName =
  | "click"
  | "toggle"
  | "correct"
  | "wrong"
  | "streak"
  | "levelup"
  | "achievement"
  | "questdone"
  | "duelwin";

const SOUND_KEY = "hp-lift-sound";
const NOTE = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  E4: 329.63,
  G4: 392.0,
  C4: 261.63,
  A4: 440.0,
} as const;

let ctx: AudioContext | null = null;
let enabled = false;

try {
  enabled = localStorage.getItem(SOUND_KEY) === "1";
} catch {
  /* SSR eller blockerad localStorage — förblir avstängt */
}

/** Måste anropas i användarinteraktion innan ljud spelas. */
function ensureContext(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = "sine",
  peak = 0.12,
) {
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ac.currentTime + startAt;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    /* ljud får aldrig krascha appen */
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignorera */
  }
  if (on) {
    const ac = ensureContext();
    if (ac) {
      tone(ac, NOTE.E5, 0, 0.09, "sine", 0.1);
      tone(ac, NOTE.A5, 0.08, 0.12, "sine", 0.1);
    }
  }
}

export function play(name: SoundName): void {
  const ac = ensureContext();
  if (!ac) return;

  switch (name) {
    case "click":
      tone(ac, NOTE.E5, 0, 0.05, "sine", 0.05);
      break;
    case "toggle":
      tone(ac, NOTE.C5, 0, 0.06, "sine", 0.08);
      tone(ac, NOTE.E5, 0.05, 0.08, "sine", 0.08);
      break;
    case "correct":
      tone(ac, NOTE.A4, 0, 0.1, "triangle", 0.12);
      tone(ac, NOTE.E5, 0.07, 0.14, "triangle", 0.12);
      break;
    case "wrong":
      tone(ac, 220, 0, 0.14, "sine", 0.09);
      tone(ac, 185, 0.1, 0.16, "sine", 0.09);
      break;
    case "streak":
      tone(ac, NOTE.C5, 0, 0.09, "triangle", 0.1);
      tone(ac, NOTE.E5, 0.07, 0.09, "triangle", 0.1);
      tone(ac, NOTE.G5, 0.14, 0.09, "triangle", 0.1);
      tone(ac, NOTE.C6, 0.21, 0.16, "triangle", 0.12);
      break;
    case "levelup":
      tone(ac, NOTE.C5, 0, 0.12, "triangle", 0.12);
      tone(ac, NOTE.E5, 0.09, 0.12, "triangle", 0.12);
      tone(ac, NOTE.G5, 0.18, 0.12, "triangle", 0.12);
      tone(ac, NOTE.C6, 0.27, 0.2, "triangle", 0.14);
      tone(ac, NOTE.E6, 0.36, 0.3, "sine", 0.1);
      break;
    case "achievement":
      tone(ac, NOTE.C6, 0, 0.1, "sine", 0.1);
      tone(ac, NOTE.G5, 0.08, 0.1, "sine", 0.1);
      tone(ac, NOTE.E6, 0.16, 0.22, "sine", 0.12);
      break;
    case "questdone":
      tone(ac, NOTE.C5, 0, 0.08, "triangle", 0.1);
      tone(ac, NOTE.D5, 0.07, 0.08, "triangle", 0.1);
      tone(ac, NOTE.E5, 0.14, 0.08, "triangle", 0.1);
      tone(ac, NOTE.G5, 0.21, 0.14, "triangle", 0.12);
      break;
    case "duelwin":
      tone(ac, NOTE.E4, 0, 0.1, "square", 0.07);
      tone(ac, NOTE.G4, 0.09, 0.1, "square", 0.07);
      tone(ac, NOTE.C5, 0.18, 0.14, "square", 0.08);
      tone(ac, NOTE.E5, 0.27, 0.22, "triangle", 0.12);
      break;
  }
}

/* AudioContext får skapas/återupptas först vid användarinteraktion. */
if (typeof window !== "undefined") {
  const unlock = () => ensureContext();
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true, passive: true });
}
