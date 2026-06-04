import type { Song } from './types'

export const SONGS: Song[] = [
  {
    name: 'Ovčáci čtveráci',
    melody: [
      'C4', 'E4', 'G4',
      'C4', 'E4', 'G4',
      'E4', 'E4', 'D4', 'E4', 'F4', 'D4',
      'E4', 'E4', 'D4', 'E4', 'F4', 'D4',
      'E4', 'D4', 'C4'
    ]
  },
  {
    name: 'Skákal pes',
    melody: [
      'G4', 'G4', 'E4',
      'G4', 'G4', 'E4',
      'G4', 'G4', 'A4', 'G4',
      'G4', 'F4',
      'F4', 'F4', 'D4',
      'F4', 'F4', 'D4',
      'F4', 'F4', 'G4', 'F4',
      'F4', 'E4'
    ]
  },
  {
    name: 'Kočka leze dírou',
    melody: [
      'C4', 'D4', 'E4', 'F4',
      'G4', 'G4', 'A4', 'A4',
      'G4', 'A4', 'A4', 'G4',
      'F4', 'F4', 'F4', 'F4',
      'E4', 'E4', 'D4', 'D4',
      'G4', 'F4', 'F4', 'F4', 'F4',
      'E4', 'E4', 'D4', 'D4',
      'C4'
    ]
  },
  {
    name: 'Prší, prší',
    melody: [
      'G4', 'G4', 'A4', 'G4',
      'G4', 'G4', 'A4', 'G4',
      'G4', 'G4', 'A4', 'G4',
      'F4', 'F4', 'F4', 'F4',
      'E4', 'E4', 'E4',
      'D4', 'D4', 'G4', 'G4',
      'C4', 'C4', 'C4'
    ]
  },
  {
    name: 'Shape of You',
    melody: [
      'D4', 'F4', 'D4', 'D4',
      'F4', 'D4', 'D4', 'F4',
      'D4', 'E4', 'D4', 'C4'
    ]
  },
  {
    name: 'Starý farmář farmu měl',
    melody: [
      'C4', 'C4', 'C4', 'G4', 'A4', 'A4', 'G4',
      'E4', 'E4', 'D4', 'D4', 'C4', 'C4', 'G4',
      'C4', 'C4', 'C4', 'G4', 'A4', 'A4', 'G4',
      'E4', 'E4', 'D4', 'D4', 'C4'
    ]
  },
  {
    name: 'Rolničky',
    melody: [
      'E4', 'E4', 'E4', 'E4',
      'E4', 'E4', 'E4', 'G4',
      'C4', 'D4', 'E4',
      'F4', 'F4', 'F4', 'F4',
      'F4', 'E4', 'E4',
      'E4', 'D4', 'D4',
      'E4', 'D4', 'G4'
    ]
  },
  {
    name: 'Když jsem já sloužil',
    melody: [
      'C4', 'C4', 'C4', 'C4',
      'E4', 'D4', 'C4', 'B3',
      'C4', 'D4',
      'D4', 'D4', 'D4', 'D4',
      'F4', 'E4', 'E4',
      'D4', 'D4', 'C4',
      'C4', 'C4', 'C4', 'C4',
      'E4', 'C4', 'C4', 'D4',
      'C4', 'B3', 'C4', 'D4', 'D4', 'D4',
      'D4', 'D4', 'D4', 'F4',
      'E4', 'E4', 'D4', 'D4', 'C4'
    ]
  },
  {
    name: 'Bude zima, bude mráz',
    melody: [
      'C4', 'F4', 'F4', 'F4',
      'G4', 'A4', 'F4', 'G4',
      'A4', 'A#4',
      'A#4', 'A#4', 'A4', 'G4',
      'G4', 'F4', 'E4',
      'F4', 'E4', 'D4',
      'C4', 'C4', 'F4',
      'F4', 'F4', 'G4', 'A4', 'F4'
    ]
  }
]

export const DEFAULT_SONG: Song = {
  name: 'Základní melodie',
  melody: ['C4', 'E4', 'G4']
}
