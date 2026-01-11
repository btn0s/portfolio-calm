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
