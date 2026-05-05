// Klávesové mapování – 2 oktávy jako piano
// Spodní řada (z x c v b n m) = C3–B3
// Prostřední řada (a s d f g h j) = C4–B4
const NOTE_KEYS: Record<string, string> = {
  z: 'C3', x: 'D3', c: 'E3', v: 'F3', b: 'G3', n: 'A3', m: 'B3',
  a: 'C4', s: 'D4', d: 'E4', f: 'F4', g: 'G4', h: 'A4', j: 'B4',
  k: 'C5'
}

const audioCache: Record<string, HTMLAudioElement> = {}
let notesMuted = false

function getAudio(note: string): HTMLAudioElement {
  if (!audioCache[note]) {
    audioCache[note] = new Audio(`/sounds/${encodeURIComponent(note)}.mp3`)
  }
  return audioCache[note]
}

export function playNote(note: string): void {
  if (notesMuted) return

  const audio = getAudio(note)
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export function setNotesMuted(muted: boolean): void {
  notesMuted = muted
}

export function keyToNote(key: string): string | null {
  return NOTE_KEYS[key.toLowerCase()] ?? null
}

// Všechny noty v pořadí pro zobrazení piano kláves
export const ALL_NOTES: string[] = [
  'C3','D3','E3','F3','G3','A3','B3',
  'C4','D4','E4','F4','G4','A4','B4',
  'C5'
]

// Popisky kláves pro UI
export const NOTE_KEY_LABELS: Record<string, string> = {
  C3:'Z', D3:'X', E3:'C', F3:'V', G3:'B', A3:'N', B3:'M',
  C4:'A', D4:'S', E4:'D', F4:'F', G4:'G', A4:'H', B4:'J',
  C5:'K'
}
