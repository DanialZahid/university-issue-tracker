'use client';

export async function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const colors = ['#155dfc', '#8b5cf6', '#f472b6', '#22c55e', '#f59e0b'];
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
}

// A small burst centered on one element, for example a card turning resolved.
export async function celebrateAt(element: Element) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const box = element.getBoundingClientRect();
  confetti({
    particleCount: 24,
    spread: 70,
    startVelocity: 16,
    gravity: 0.7,
    scalar: 0.6,
    ticks: 80,
    origin: {
      x: (box.left + box.width / 2) / window.innerWidth,
      y: (box.top + box.height / 2) / window.innerHeight,
    },
    colors: ['#155dfc', '#8b5cf6', '#f472b6', '#22c55e', '#f59e0b'],
    disableForReducedMotion: true,
  });
}
