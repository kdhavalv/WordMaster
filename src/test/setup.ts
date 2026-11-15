import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

class MockSpeechSynthesisUtterance {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  volume = 1
  voice: SpeechSynthesisVoice | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

const speechSynthesis = {
  getVoices: () => [] as SpeechSynthesisVoice[],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  cancel: vi.fn(),
  speak: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
}

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  configurable: true,
  writable: true,
  value: MockSpeechSynthesisUtterance,
})
Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  configurable: true,
  writable: true,
  value: MockSpeechSynthesisUtterance,
})
Object.defineProperty(window, 'speechSynthesis', {
  configurable: true,
  value: speechSynthesis,
})
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => null,
})

beforeEach(() => {
  window.localStorage.clear()
  window.confirm = vi.fn(() => true)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
