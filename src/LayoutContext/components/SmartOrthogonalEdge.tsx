// src/components/SmartOrthogonalEdge.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  BaseEdge,
  BezierEdge,
  EdgeProps,
  useStore,
  InternalNode,
} from '@xyflow/react';
import { generateGrid } from '../utils/grid';
import { findPath } from '../utils/pathfinder';
import { pointsToPath } from '../utils/svg';

type Config = {
  gridSize?: number;
  nodePadding?: number;
};

const DEFAULT_CONFIG: Config = {
  gridSize: 30,
  nodePadding: 40,
};

type ObstacleNode = {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};

export function SmartOrthogonalEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style,
    data,
  } = props;

  const config = { ...DEFAULT_CONFIG, ...(data as Config) };

  console.log(`SmartEdge rendering edge ${id} from ${source} to ${target}`);
  // 1) build obstacle list (including source/target)
  const nodeLookup = useStore((s) => s.nodeLookup);
  const obstacleNodes: ObstacleNode[] = useMemo(() => {
    const all = Array.from(nodeLookup.values());
    const srcNode = nodeLookup.get(source);
    const tgtNode = nodeLookup.get(target);
    const parentMatch =
      srcNode?.parentId && srcNode.parentId === tgtNode?.parentId
        ? srcNode.parentId
        : null;

    return all
      .filter((n) => n.id !== parentMatch) // exclude shared parent if in same subflow
      .map((n: InternalNode) => ({
        id: n.id,
        position: n.internals.positionAbsolute!,
        width: n.measured?.width ?? 0,
        height: n.measured?.height ?? 0,
      }));
  }, [nodeLookup, source, target]);

  // 2) edgePath state
  const [edgePath, setEdgePath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function computePath() {
      // wait until all nodes measured
      if (obstacleNodes.some((n) => n.width === 0 || n.height === 0)) {
        setEdgePath(null);
        return;
      }

      // build grid
      const grid = generateGrid({
        nodes: obstacleNodes,
        gridSize: config.gridSize!,
        nodePadding: config.nodePadding!,
        edgePoints: [
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY },
        ],
      });

      // await the async findPath
      const pts = await findPath({
        sourcePos: { x: sourceX, y: sourceY },
        targetPos: { x: targetX, y: targetY },
        grid,
        gridSize: config.gridSize!,
        nodePadding: config.nodePadding!,
        nodes: obstacleNodes,
      });

      if (cancelled) return;

      if (!pts) {
        console.warn(`SmartEdge: no path for edge ${id}, falling back`);
        setEdgePath(null);
      } else {
        setEdgePath(pointsToPath(pts));
      }
    }

    computePath();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    obstacleNodes,
    config.gridSize,
    config.nodePadding,
  ]);

  // 3) render
  if (!edgePath) {
    return <BezierEdge {...props} />;
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
