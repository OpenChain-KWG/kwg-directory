import type { Member } from '@/types/member'

/** Sort modes exposed in the directory v2 filter bar. */
export type DirectorySort = 'name' | 'joined' | 'random'

/**
 * Deterministic Fisher–Yates using a numeric seed so the random sort is stable
 * across renders within the same page load (seed comes from page-level useMemo).
 */
function shuffle<T>(items: T[], seed: number): T[] {
  const copy = items.slice()
  let s = seed || 1
  for (let i = copy.length - 1; i > 0; i -= 1) {
    // xorshift32-ish step keeps the seed away from 0 without bias for our scale.
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    const j = Math.abs(s) % (i + 1)
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

/** Pure sort over an array of Member; never mutates the input. */
export function sortMembers(
  members: readonly Member[],
  mode: DirectorySort,
  seed = 1,
): Member[] {
  if (mode === 'name') {
    return members
      .slice()
      .sort((a, b) =>
        a.name_ko.localeCompare(b.name_ko, 'ko-KR', { sensitivity: 'base' }),
      )
  }
  if (mode === 'joined') {
    return members
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }
  return shuffle(members.slice(), seed)
}
