import { uhrSource } from "@/lib/uhr";
import { cn } from "@/lib/utils";

/**
 * Källan under en fråga ur UHR:s prov, t.ex. "Källa: Högskoleprovet hösten
 * 2019, provpass 1, uppgift 3 (UHR)". Visar ingenting för appens egna frågor.
 */
export function QuestionSource({ id, className }: { id: string; className?: string }) {
  const source = uhrSource(id);
  if (!source) return null;
  return <p className={cn("mt-1.5 text-xs text-[var(--ink-muted)]", className)}>Källa: {source} (UHR)</p>;
}
