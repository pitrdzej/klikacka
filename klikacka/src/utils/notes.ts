export type PianoDisplayKey = { note: string; label: string }

const NOTE_KEYS: Record<string, string> = {
  a: 'C4',
  s: 'D4',
  d: 'E4',
  f: 'F4',
  g: 'G4',
  h: 'A4',
  j: 'B4',
  k: 'C5',
  w: 'C#4',
  e: 'D#4',
  t: 'F#4',
  z: 'G#4',
  u: 'A#4'
}

export const EXTENDED_NOTE_KEYS: Record<string, string> = {
  ...NOTE_KEYS,
  q: 'C3',
  x: 'D3',
  c: 'E3',
  v: 'F3',
  b: 'G3',
  n: 'A3',
  m: 'B3',
  r: 'D5',
  y: 'E5',
  i: 'F5',
  o: 'G5',
  p: 'A5',
  l: 'B5'
}

const EXTENDED_CODE_NOTE_KEYS: Record<string, string> = {
  Digit1: 'C#3',
  Digit2: 'D#3',
  Digit3: 'F#3',
  Digit4: 'G#3',
  Digit5: 'A#3',
  Digit6: 'C#5',
  Digit7: 'D#5',
  Digit8: 'F#5',
  Digit9: 'G#5',
  Digit0: 'A#5'
}

const audioTemplateCache: Record<string, HTMLAudioElement> = {}
let notesMuted = false

function getAudioTemplate(note: string): HTMLAudioElement {
  if (!audioTemplateCache[note]) {
    const audio = new Audio(`sounds/${encodeURIComponent(note)}.mp3`)
    audio.preload = 'auto'
    audioTemplateCache[note] = audio
  }
  return audioTemplateCache[note]
}

export function playNote(note: string): void {
  if (notesMuted) return

  const audio = getAudioTemplate(note).cloneNode() as HTMLAudioElement
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export function setNotesMuted(muted: boolean): void {
  notesMuted = muted
}

export function keyToNote(key: string): string | null {
  return NOTE_KEYS[key.toLowerCase()] ?? null
}

export function extendedKeyToNote(key: string, code?: string): string | null {
  if (code && EXTENDED_CODE_NOTE_KEYS[code]) {
    return EXTENDED_CODE_NOTE_KEYS[code] ?? null
  }

  return EXTENDED_NOTE_KEYS[key.toLowerCase()] ?? null
}

export const PIANO_WHITE_KEYS: PianoDisplayKey[] = [
  { note: 'C4', label: 'A' },
  { note: 'D4', label: 'S' },
  { note: 'E4', label: 'D' },
  { note: 'F4', label: 'F' },
  { note: 'G4', label: 'G' },
  { note: 'A4', label: 'H' },
  { note: 'B4', label: 'J' },
  { note: 'C5', label: 'K' }
]

export const PIANO_BLACK_KEYS: Array<PianoDisplayKey | null> = [
  { note: 'C#4', label: 'W' },
  { note: 'D#4', label: 'E' },
  null,
  { note: 'F#4', label: 'T' },
  { note: 'G#4', label: 'Z' },
  { note: 'A#4', label: 'U' },
  null
]
