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
