/**
 * The least a signature has to measure, in pixels of the drawing pad (about a third of its width). A tap or a dot is
 * not a signature; a real one is several times this.
 */
export const MIN_SIGNATURE_LENGTH = 120;

/** The length of everything drawn, from the stroke data the pad reports (a JSON list of strokes of points). */
export function signatureLength(strokeData: string): number {
  try {
    const strokes = JSON.parse(strokeData) as { points?: { x: number; y: number }[] }[];
    let total = 0;
    for (const stroke of strokes ?? []) {
      const points = stroke.points ?? [];
      for (let i = 1; i < points.length; i++) {
        total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      }
    }
    return total;
  } catch {
    return 0;
  }
}
