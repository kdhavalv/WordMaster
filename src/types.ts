export type SessionMode = 'practice' | 'exam'

export type WordList = {
  id: string
  name: string
  words: string[]
  createdAt: string
  updatedAt: string
}

export type SessionResult = {
  id: string
  listId: string
  listName: string
  mode: SessionMode
  date: string
  total: number
  correct: number
  wrongWords: string[]
}

export type Settings = {
  voiceURI?: string
  rate: number
  autoPlay: boolean
  defaultWordCount: number
  shuffle: boolean
}

export type SessionConfig = {
  listId: string
  listName: string
  words: string[]
  allWords: string[]
  wordCount: number
  mode: SessionMode
}
