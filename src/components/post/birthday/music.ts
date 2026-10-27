// The soundtrack: a loop under the cards, then a finale cue that hits on the reveal.
// iOS only lets audio start inside a tap and ignores <audio>.volume, so both tracks
// are unlocked on the first tap and run through Web Audio gain nodes for fades.

// How each scene sounds: a low-pass on the music, its level, how loud the crowd is,
// and how many seconds it takes to get there.
export type Mood = 'far' | 'intimate' | 'party' | 'inside' | 'crowd' | 'tunnel';
export const MOODS: Record<Mood, { hz: number; level: number; roar: number; fade?: number }> = {
  far: { hz: 420, level: 0.35, roar: 0 }, // through a wall, barely there
  intimate: { hz: 1300, level: 0.7, roar: 0 }, // quiet and close, like it's in the next room
  party: { hz: 20000, level: 1, roar: 0 },
  // Warmer, as if heard from inside the ball, easing in over the dive so the
  // "Happy birthday" build doesn't drop off a cliff.
  inside: { hz: 2200, level: 0.9, roar: 0, fade: 3 },
  crowd: { hz: 20000, level: 0.85, roar: 0.4 },
  tunnel: { hz: 20000, level: 1, roar: 0 },
};
export const FINALE_IN = 18.4;
export const FINALE_OPEN = 19.7;
export const FINALE_RUN = 21.94;
export const FINALE_HIT = 23;

