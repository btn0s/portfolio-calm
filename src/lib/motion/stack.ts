// Shared stack motion primitives for consistent card stack animations

export const STACK_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

// Seed-based pseudo-random for consistent but varied offsets
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

export function getStackOffset(position: number) {
  const direction = position % 2 === 0 ? -1 : 1;
  const baseX = direction * (30 + position * 15);

  return {
    x: baseX + (seededRandom(position * 1.1) - 0.5) * 20,
    y: (seededRandom(position * 2.2) - 0.5) * 20 + position * 5,
    rotate: direction * (3 + seededRandom(position * 3.3) * 5),
  };
}

/**
 * Key moments of a STACK_SPRING move from rest (unit mass, the Framer Motion default), so
 * anything that accompanies the motion (sound) can follow the actual spring instead of a
 * guessed duration. Times are in seconds.
 */
export function getStackSpringTimeline(spring = STACK_SPRING) {
  const dt = 1 / 2000;
  let x = 1; // remaining distance (fraction of the move)
  let v = 0;
  let t = 0;
  let peakSpeed = 0;
  let peakSpeedAt = 0;
  let landedAt = 0;
  let settledAt = 0;
  while (t < 2) {
    const a = -spring.stiffness * x - spring.damping * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    if (Math.abs(v) > peakSpeed) {
      peakSpeed = Math.abs(v);
      peakSpeedAt = t;
    }
    // "Landed": within 10% of the target, the moment the eye reads it as arrived.
    if (!landedAt && Math.abs(x) < 0.1) landedAt = t;
    if (!settledAt && Math.abs(x) < 0.01 && Math.abs(v) < 0.05) {
      settledAt = t;
      break;
    }
  }
  return { peakSpeedAt, landedAt, settledAt: settledAt || t };
}

/**
 * A flicked card's flip: a looser spring than STACK_SPRING that starts at the release velocity
 * (boosted, so a flick reads as a throw), carrying the card out the side it was thrown toward
 * before it pulls in behind the stack. One continuous motion: no stop before the flip.
 */
export const STACK_THROW_SPRING = { type: "spring" as const, stiffness: 90, damping: 16 };
const THROW = {
  /** Release velocity multiplier and cap (px/s). */
  boost: 2.5,
  maxSpeed: 8000,
  /** Vertical throw is damped: cards travel sideways. */
  verticalShare: 0.4,
  /** Spin into the throw: deg/s per px/s of horizontal release, capped. */
  spinPerPx: 0.06,
  maxSpin: 240,
};

/** Initial velocities (px/s, deg/s) for a card released at (velocityX, velocityY) px/s. */
export function getStackThrow(velocityX: number, velocityY: number) {
  const clamp = (v: number, limit: number) => Math.min(limit, Math.max(-limit, v));
  return {
    x: clamp(velocityX * THROW.boost, THROW.maxSpeed),
    y: clamp(velocityY * THROW.boost * THROW.verticalShare, THROW.maxSpeed * THROW.verticalShare),
    rotate: clamp(velocityX * THROW.spinPerPx, THROW.maxSpin),
  };
}

/**
 * When (s) a STACK_THROW_SPRING move from `from` to `to` px, starting at `velocity` px/s, first
 * comes within 20px of its target: the thrown card arriving behind the stack.
 */
export function getStackThrowLanding(from: number, to: number, velocity: number) {
  const { stiffness, damping } = STACK_THROW_SPRING;
  const dt = 1 / 2000;
  let x = from;
  let v = velocity;
  for (let t = 0; t < 2; t += dt) {
    v += (-stiffness * (x - to) - damping * v) * dt;
    x += v * dt;
    if (t > 0.05 && Math.abs(x - to) < 20) return t;
  }
  return 2;
}
