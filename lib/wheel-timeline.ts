// lib/wheel-timeline.ts

export type WheelCommander =
  | 'Cao Cao'
  | 'Richard I'
  | 'Yi Seong-Gye'
  | 'Alexander'
  | 'SoC Infantry'
  | 'SoC Cavalry'
  | 'SoC Archer'
  | 'SoC Leadership'

type WheelEntry = {
  age: number
  commander: WheelCommander
}

/**
 * Early-game wheel sequence.
 * Ages are approximate and can be tuned later.
 */
const EARLY_WHEEL_SEQUENCE: WheelEntry[] = [
  { age: 40, commander: 'Cao Cao' },

  { age: 60, commander: 'Richard I' },
  { age: 74, commander: 'Richard I' },
  { age: 88, commander: 'Richard I' },

  { age: 102, commander: 'Yi Seong-Gye' },
  { age: 116, commander: 'Yi Seong-Gye' },
  { age: 130, commander: 'Yi Seong-Gye' },

  { age: 150, commander: 'Alexander' },
  { age: 164, commander: 'Alexander' },
]

const SOC_ROTATION: WheelCommander[] = [
  'SoC Infantry',
  'SoC Cavalry',
  'SoC Archer',
  'SoC Leadership',
]

/**
 * Returns wheel commanders between two ages.
 */
export function getWheelTimeline(
  startAge: number,
  endAge: number
) {
  const result: { age: number; commander: WheelCommander }[] = []

  // Early fixed wheels
  for (const w of EARLY_WHEEL_SEQUENCE) {
    if (w.age >= startAge && w.age <= endAge) {
      result.push(w)
    }
  }

  // After ~170 days assume SoC repeating rotation
  const socStart = Math.max(startAge, 170)

  if (endAge >= socStart) {
    let age = socStart
    let i = 0

    while (age <= endAge) {
      result.push({
        age,
        commander: SOC_ROTATION[i % SOC_ROTATION.length],
      })

      age += 14 // approx wheel spacing
      i++
    }
  }

  return result
}
