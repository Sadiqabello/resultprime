import type { TieStrategy } from "@/config/constants";

export interface Rankable {
  ref: string;
  score: number | null;
  excluded?: boolean; // absent/exempt, depending on policy
}

/**
 * Assign positions by score descending. Ties share a position; the tie strategy
 * controls what comes after a tie:
 *   - "dense":    1, 2, 2, 3   (no gaps)
 *   - "standard": 1, 2, 2, 4   (gaps after ties — competition ranking)
 * Excluded entries (absent/exempt per policy) receive a null position and do
 * not consume a rank slot. Deterministic and stable for equal scores.
 */
export function rank(
  items: Rankable[],
  strategy: TieStrategy = "standard",
): Map<string, number | null> {
  const positions = new Map<string, number | null>();

  const ranked = items.filter((i) => !i.excluded && i.score !== null);
  const excluded = items.filter((i) => i.excluded || i.score === null);

  ranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  let position = 0;
  let seen = 0;
  let prevScore: number | null = null;

  for (const item of ranked) {
    seen += 1;
    if (item.score !== prevScore) {
      position = strategy === "dense" ? position + 1 : seen;
      prevScore = item.score;
    }
    positions.set(item.ref, position);
  }

  for (const item of excluded) positions.set(item.ref, null);
  return positions;
}
