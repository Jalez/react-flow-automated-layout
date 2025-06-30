// src/utils/pathfinder.ts
import { type XYPosition } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { AStarFinder, Grid } from 'pathfinding';

interface PathOptions {
  sourcePos: XYPosition;
  targetPos: XYPosition;
  grid: Grid & { originOffset?: XYPosition };
  gridSize: number;
  nodePadding?: number;
  nodes?: { id: string; position: { x: number; y: number }; width: number; height: number }[];
}

export async function findPath({
  sourcePos,
  targetPos,
  grid,
  gridSize,
  nodePadding = 10,
  nodes = [],
}: PathOptions): Promise<XYPosition[] | null> {
  // ● 1) Attempt ELKJS orthogonal routing
  const elk = new ELK();
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.unnecessaryBendpoints': 'true',
      'elk.spacing.edgeNodeBetweenLayers': `${nodePadding}`,
    },
    children: [
      ...nodes.map(n => ({ id: n.id, width: n.width, height: n.height })),
      { id: '__src__', width: 0, height: 0 },
      { id: '__tgt__', width: 0, height: 0 },
    ],
    ports: [
      { id: '__src__', x: sourcePos.x, y: sourcePos.y },
      { id: '__tgt__', x: targetPos.x, y: targetPos.y },
    ],
    edges: [{
      id: 'edge0',
      sources: ['__src__'],
      targets: ['__tgt__'],
    }],
  };

  try {
    const elkResult = await elk.layout(elkGraph);
    const edge = elkResult.edges?.find(e => e.id === 'edge0');
    if (edge) {
      const bends: XYPosition[] = [];
      for (const sec of edge.sections || []) {
        for (const bp of sec.bendPoints || []) {
          bends.push({ x: bp.x, y: bp.y });
        }
      }
      return [sourcePos, ...bends, targetPos];
    }
  } catch (e) {
    console.warn('ELKJS routing failed, falling back to A*', e);
  }

  // ● 2) Fallback A* (unchanged)
  const originOffset = grid.originOffset ?? { x: 0, y: 0 };
  const sx = Math.floor((sourcePos.x - originOffset.x) / gridSize);
  const sy = Math.floor((sourcePos.y - originOffset.y) / gridSize);
  const ex = Math.floor((targetPos.x - originOffset.x) / gridSize);
  const ey = Math.floor((targetPos.y - originOffset.y) / gridSize);
  if (!grid.isInside(sx, sy) || !grid.isInside(ex, ey)) return null;

  const gridClone = grid.clone();
  gridClone.setWalkableAt(sx, sy, true);
  gridClone.setWalkableAt(ex, ey, true);

  const finder = new AStarFinder({ allowDiagonal: false });
  const raw = finder.findPath(sx, sy, ex, ey, gridClone);
  if (!raw.length) return null;

  const world = raw.map(([x, y]) => ({
    x: x * gridSize + originOffset.x + gridSize / 2,
    y: y * gridSize + originOffset.y + gridSize / 2,
  }));
  const optimized = optimizePathForFewerTurns(world.map(p => [p.x, p.y]));
  return optimized.map(([x, y]) => ({ x, y }) );
}

// (reuse your existing optimizePathForFewerTurns here)

// —————— prune redundant turns ——————

function optimizePathForFewerTurns(path: number[][]): number[][] {
  if (path.length < 3) return path;
  const out = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const [x0, y0] = path[i - 1],
          [x1, y1] = path[i],
          [x2, y2] = path[i + 1];
    const d1 = Math.abs(x1 - x0) > Math.abs(y1 - y0) ? 'h' : 'v';
    const d2 = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? 'h' : 'v';
    if (d1 !== d2) out.push([x1, y1]);
  }
  out.push(path[path.length - 1]);
  return out;
}
