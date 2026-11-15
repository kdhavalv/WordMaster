import type { WordList } from '../types'
import wordBankJson from './wordBank.json'

export type WordType = 'noun' | 'verb' | 'adjective' | 'other'
export type Theme =
  | 'alltag'
  | 'haus'
  | 'essen'
  | 'obst'
  | 'gemuese'
  | 'natur'
  | 'tiere'
  | 'koerper'
  | 'schule'
  | 'arbeit'
  | 'berufe'
  | 'sport'
  | 'reise'
  | 'zeit'
  | 'gefuehle'
  | 'gegenstaende'
  | 'abstrakt'

export type WordEntry = {
  word: string
  level: 1 | 2 | 3 | 4
  type: WordType
  themes: Theme[]
}

export const WORD_BANK: WordEntry[] = wordBankJson as WordEntry[]

export const THEME_META: Record<Theme, { de: string; en: string }> = {
  alltag: { de: 'Alltag', en: 'Everyday life' },
  haus: { de: 'Haus & Wohnen', en: 'Home' },
  essen: { de: 'Essen & Trinken', en: 'Food & drink' },
  obst: { de: 'Obst', en: 'Fruit' },
  gemuese: { de: 'Gemüse', en: 'Vegetables' },
  natur: { de: 'Natur & Wetter', en: 'Nature & weather' },
  tiere: { de: 'Tiere', en: 'Animals' },
  koerper: { de: 'Körper & Gesundheit', en: 'Body & health' },
  schule: { de: 'Schule & Lernen', en: 'School & learning' },
  arbeit: { de: 'Arbeit & Büro', en: 'Work & office' },
  berufe: { de: 'Berufe', en: 'Professions' },
  sport: { de: 'Sport & Bewegung', en: 'Sports & movement' },
  reise: { de: 'Reisen & Verkehr', en: 'Travel & transport' },
  zeit: { de: 'Zeit', en: 'Time' },
  gefuehle: { de: 'Gefühle', en: 'Feelings' },
  gegenstaende: { de: 'Gegenstände', en: 'Objects' },
  abstrakt: { de: 'Abstrakte Begriffe', en: 'Abstract concepts' },
}

export const TYPE_META: Record<WordType, { de: string; en: string }> = {
  noun: { de: 'Nomen', en: 'Nouns' },
  verb: { de: 'Verben', en: 'Verbs' },
  adjective: { de: 'Adjektive', en: 'Adjectives' },
  other: { de: 'Andere Wörter', en: 'Other words' },
}

export const STARTER_LIST_ID = 'starter-grundwortschatz'

const levelDescriptions: Record<1 | 2 | 3 | 4, { de: string; en: string }> = {
  1: { de: 'Kurze, konkrete Wörter mit regelmäßiger Schreibweise.', en: 'Short, concrete words with regular spelling.' },
  2: { de: 'Häufige Wörter mit typischen Rechtschreibmustern.', en: 'Common words with typical spelling patterns.' },
  3: { de: 'Wörter mit Dehnung, s/ss/ß, v/f und Wortbausteinen.', en: 'Words with vowel length, s/ss/ß, v/f, and word parts.' },
  4: { de: 'Längere Wörter, Komposita und anspruchsvollere Schreibweisen.', en: 'Longer words, compounds, and more demanding spellings.' },
}

function makePack(
  id: string,
  name: string,
  description: string,
  words: string[],
  level?: 1 | 2 | 3 | 4,
): WordList {
  return {
    id,
    name,
    description,
    words,
    ...(level ? { level } : {}),
    source: id === STARTER_LIST_ID ? 'starter' : 'curated',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

export const LEVEL_PACKS: WordList[] = ([1, 2, 3, 4] as const).map((level) => {
  const words = WORD_BANK.filter((e) => e.level === level).map((e) => e.word)
  if (level === 2) {
    return makePack(
      STARTER_LIST_ID,
      'Grundwortschatz (Level 2)',
      levelDescriptions[2].de,
      words,
      2,
    )
  }
  return makePack(
    `curated-level-${level}`,
    `Level ${level}`,
    levelDescriptions[level].de,
    words,
    level,
  )
})

export const THEME_PACKS: WordList[] = (Object.keys(THEME_META) as Theme[])
  .map((theme) => {
    const words = WORD_BANK.filter((e) => e.themes.includes(theme)).map((e) => e.word)
    return makePack(`curated-theme-${theme}`, THEME_META[theme].de, '', words)
  })
  .filter((pack) => pack.words.length >= 10)

export const TYPE_PACKS: WordList[] = (Object.keys(TYPE_META) as WordType[])
  .map((type) => {
    const words = WORD_BANK.filter((e) => e.type === type).map((e) => e.word)
    return makePack(`curated-type-${type}`, TYPE_META[type].de, '', words)
  })
  .filter((pack) => pack.words.length >= 10)

export const STARTER_LIST = LEVEL_PACKS.find((p) => p.id === STARTER_LIST_ID)!
export const CURATED_LISTS = LEVEL_PACKS
export const CURATED_PACKS = [...LEVEL_PACKS, ...THEME_PACKS, ...TYPE_PACKS]

export const CURATED_TEXT_KEYS: Record<string, { name: string; description?: string }> = {
  [STARTER_LIST_ID]: { name: 'starter.name', description: 'starter.description' },
  'curated-level-1': { name: 'curated.level1.name', description: 'curated.level1.description' },
  'curated-level-3': { name: 'curated.level3.name', description: 'curated.level3.description' },
  'curated-level-4': { name: 'curated.level4.name', description: 'curated.level4.description' },
  'curated-theme-alltag': { name: 'theme.alltag' },
  'curated-theme-haus': { name: 'theme.haus' },
  'curated-theme-essen': { name: 'theme.essen' },
  'curated-theme-obst': { name: 'theme.obst' },
  'curated-theme-gemuese': { name: 'theme.gemuese' },
  'curated-theme-natur': { name: 'theme.natur' },
  'curated-theme-tiere': { name: 'theme.tiere' },
  'curated-theme-koerper': { name: 'theme.koerper' },
  'curated-theme-schule': { name: 'theme.schule' },
  'curated-theme-arbeit': { name: 'theme.arbeit' },
  'curated-theme-berufe': { name: 'theme.berufe' },
  'curated-theme-sport': { name: 'theme.sport' },
  'curated-theme-reise': { name: 'theme.reise' },
  'curated-theme-zeit': { name: 'theme.zeit' },
  'curated-theme-gefuehle': { name: 'theme.gefuehle' },
  'curated-theme-gegenstaende': { name: 'theme.gegenstaende' },
  'curated-theme-abstrakt': { name: 'theme.abstrakt' },
  'curated-type-noun': { name: 'type.noun' },
  'curated-type-verb': { name: 'type.verb' },
  'curated-type-adjective': { name: 'type.adjective' },
  'curated-type-other': { name: 'type.other' },
}
