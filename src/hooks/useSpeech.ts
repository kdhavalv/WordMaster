import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useSpeech(voiceURI: string | undefined, rate: number) {
  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!supported) {
      return
    }

    const synth = window.speechSynthesis
    const updateVoices = () => setVoices(synth.getVoices())

    updateVoices()
    synth.addEventListener('voiceschanged', updateVoices)

    return () => {
      synth.removeEventListener('voiceschanged', updateVoices)

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }

      synth.cancel()
    }
  }, [supported])

  const germanVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('de')),
    [voices],
  )

  const selectedVoice = useMemo(
    () =>
      germanVoices.find((voice) => voice.voiceURI === voiceURI) ??
      germanVoices[0] ??
      undefined,
    [germanVoices, voiceURI],
  )

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        setError('Dieser Browser unterstützt keine Sprachausgabe.')
        return
      }

      const synth = window.speechSynthesis
      const utterance = new SpeechSynthesisUtterance(text)

      setError(null)
      utterance.lang = selectedVoice?.lang ?? 'de-DE'
      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = 1

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onstart = () => {
        if (utteranceRef.current === utterance) {
          setSpeaking(true)
        }
      }
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          setSpeaking(false)
          utteranceRef.current = null
        }
      }
      utterance.onerror = (event) => {
        if (utteranceRef.current !== utterance) {
          return
        }

        if (event.error === 'canceled' || event.error === 'interrupted') {
          return
        }

        setSpeaking(false)
        utteranceRef.current = null
        setError('Die Sprachausgabe ist fehlgeschlagen.')
      }

      utteranceRef.current = utterance
      synth.cancel()

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null

        if (utteranceRef.current === utterance) {
          synth.speak(utterance)
        }
      }, 40)
    },
    [rate, selectedVoice, supported],
  )

  const cancel = useCallback(() => {
    if (!supported) {
      return
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    utteranceRef.current = null
    setSpeaking(false)
    window.speechSynthesis.cancel()
  }, [supported])

  const test = useCallback(() => {
    speak('Fahrrad, Schule, Straße.')
  }, [speak])

  return {
    supported,
    speaking,
    error,
    germanVoices,
    selectedVoice,
    speak,
    cancel,
    test,
  }
}
