import type { BossProfile } from './types'

export const BOSS_WIN_MESSAGES = [
  'Celebrita {boss} ustoupila. Publikum teď přechází k Tobě.',
  'Nyní jsi králem pódia.',
  'Celebrita {boss} ztratila tempo a fanoušci skandují tvoje jméno.',
  'Stage je tvoje. Dav je na tvojí straně.'
]

export const BOSS_LOSS_MESSAGES = [
  'Publikum brečí, koncert interpreta je zrušený.',
  'Celebrita {boss} tě přehrála. Dav odchází zklamaný.',
  'Smolný večer. Město mluví o vítězství interpreta.',
  'Stage dnes nepatří tobě. Publikum je zničené.'
]

export const JAN_KAFKA_WIN_STEAL_CHANCE = 0.4
export const AUDIENCE_BOOST_BOSS_REWARD_NAMES = new Set(['Hana Zagorová', 'Jan Kafka'])

export const BOSS_ROSTER: BossProfile[] = [
  { name: 'Tomáš Klus', fame: 1.0, image: 'bosses/TomasKlus.jpg' },
  { name: 'Yzomandias', fame: 1.45, image: 'bosses/Yzomandias.jpg' },
  { name: 'Dua Lipa', fame: 1.7, image: 'bosses/DuaLipa.jpg' },
  { name: 'Ed Sheeran', fame: 1.8, image: 'bosses/EdSheeran.jpg' },
  { name: 'Billie Eilish', fame: 1.9, image: 'bosses/Billie.jpg' },
  { name: 'Hana Zagorová', fame: 2, image: 'bosses/HanaZagorova.jpg' },
  { name: 'Jan Kafka', fame: 2.2, image: 'bosses/JanKafka.jpg' }
]

export const DEFAULT_BOSS: BossProfile = {
  name: 'Tomáš Klus',
  fame: 1.0,
  image: 'bosses/TomasKlus.jpg'
}
