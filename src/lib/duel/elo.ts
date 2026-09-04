/**
 * Standard Elo-matematik. Samma formler som används i SQL-funktionerna
 * (SECURITY DEFINER) — dessa klientvarianter används enbart för förhandsvisning
 * av förväntad poängförändring i gränssnittet. Den faktiska beräkningen sker
 * i databasen.
 */

export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

/** Full Elo-förändring (människa mot människa). actual: 1 = vinst, 0 = förlust, 0.5 = oavgjort. */
export function eloChange(
  eloA: number,
  eloB: number,
  actual: 0 | 0.5 | 1,
  k = 32,
): number {
  return Math.round(k * (actual - expectedScore(eloA, eloB)));
}

/** Elo mot bot — boten är rankad på din egen ELO (förväntad poäng 0.5, K=16). */
export function botEloChange(actual: 0 | 0.5 | 1, k = 16): number {
  return Math.round(k * (actual - 0.5));
}
