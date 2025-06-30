// src/utils/svg.ts
import { type XYPosition } from '@xyflow/react';

/**
 * Converts an array of points into an SVG path string.
 * @param points - The array of {x, y} coordinates.
 * @returns An SVG 'd' attribute string.
 */
export function pointsToPath(points: XYPosition[]): string {
  if (!points || points.length < 2) {
    return '';
  }
  // This syntax is based on SVG path commands 'M' (moveto) and 'L' (lineto)
  const pathParts = points.map((p, i) => {
    const command = i === 0? 'M' : 'L';
    return `${command} ${p.x} ${p.y}`;
  });
  return pathParts.join(' ');
}