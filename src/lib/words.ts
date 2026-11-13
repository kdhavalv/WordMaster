export function parseWordInput(input: string): string[] {
  const seen = new Set<string>()
  const words: string[] = []

  for (const rawLine of input.split(/\r?\n/)) {
    const word = rawLine.trim().replace(/\s+/g, ' ')

    if (!word) {
      continue
    }

    const key = word.toLocaleLowerCase('de-DE')

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    words.push(word)
  }

  return words
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }

  return result
}

export function sampleWords(
  words: readonly string[],
  count: number,
  shouldShuffle: boolean,
): string[] {
  const safeCount = Math.max(0, Math.floor(count))
  const pool = shouldShuffle ? shuffle(words) : [...words]

  return pool.slice(0, Math.min(safeCount, pool.length))
}
