// Klávesové mapování – 2 oktávy jako piano
// Spodní řada (z x c v b n m) = C3–B3
// Prostřední řada (a s d f g h j) = C4–B4
const NOTE_KEYS: Record<string, string> = {
  z: 'C3', x: 'D3', c: 'E3', v: 'F3', b: 'G3', n: 'A3', m: 'B3',
  a: 'C4', s: 'D4', d: 'E4', f: 'F4', g: 'G4', h: 'A4', j: 'B4',
  k: 'C5'
}

// Rozšířené mapování – odemkne se s první kouptenou písničkou
// Čísla = půltóny C3–A#4, horní řada (q–p) = C5–A#5, a [ ] = B5 C6
// Shift + původní klávesy = o oktávu výš (C4→C5 atd.)
export const EXTENDED_NOTE_KEYS: Record<string, string> = {
  // zachová základní
  z: 'C3', x: 'D3', c: 'E3', v: 'F3', b: 'G3', n: 'A3', m: 'B3',
  a: 'C4', s: 'D4', d: 'E4', f: 'F4', g: 'G4', h: 'A4', j: 'B4',
  k: 'C5',
  // čísla = půltóny (sharpy) přes C3–A#4
  '1': 'C#3', '2': 'D#3', '3': 'F#3', '4': 'G#3', '5': 'A#3',
  '6': 'C#4', '7': 'D#4', '8': 'F#4', '9': 'G#4', '0': 'A#4',
  // horní klávesová řada = C5–B5
  q: 'C5', w: 'D5', e: 'E5', r: 'F5', t: 'G5', y: 'A5', u: 'B5',
  // půltóny C5–A#5
  i: 'C#5', o: 'D#5', p: 'F#5',
  // C6 a výše
  '[': 'G#5', ']': 'A#5',
  // další oktáva klávesy Shift+základní = C6–B6 (nahoře)
  'Z': 'C6', 'X': 'D6', 'C': 'E6', 'V': 'F6', 'B': 'G6', 'N': 'A6', 'M': 'B6',
  'A': 'C5', 'S': 'D5', 'D': 'E5', 'F': 'F5', 'G': 'G5', 'H': 'A5', 'J': 'B5',
  // nízká oktáva
  'K': 'C2', 'L': 'D2',
}

const audioCache: Record<string, HTMLAudioElement> = {}
let notesMuted = false

function getAudio(note: string): HTMLAudioElement {
  if (!audioCache[note]) {
    audioCache[note] = new Audio(`sounds/${encodeURIComponent(note)}.mp3`)
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
