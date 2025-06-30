// src/utils/grid.ts
import { type Node } from '@xyflow/react';
import { Grid } from 'pathfinding';

// Define a simpler type for the nodes used as obstacles
type ObstacleNode = Pick<Node, 'id' | 'position' | 'width' | 'height'>;

interface GridOptions {
  nodes: ObstacleNode[]; // Nodes with absolute positions
  gridSize: number;
  nodePadding: number;
  edgePoints?: { x: number; y: number }[]; // Optional edge connection points to include in grid bounds
}

/**
 * Generates a pathfinding grid from the current set of React Flow nodes.
 * @param options - The nodes (with absolute positions), grid cell size, and padding.
 * @returns A pathfinding.js Grid instance.
 */
export function generateGrid({ nodes, gridSize, nodePadding, edgePoints = [] }: GridOptions): Grid {
  if (nodes.length === 0) {
    return new Grid(1, 1);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    // All positions are now absolute, so this calculation is reliable
    const { position, width, height } = node;
    if (!width || !height || !position) return;
    
    // Ensure position values are finite numbers
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      console.warn(`Grid generation: Node ${node.id} has invalid position:`, position);
      return;
    }
    
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + width);
    maxY = Math.max(maxY, position.y + height);
  });
  
  // Also consider edge connection points in the grid bounds
  edgePoints.forEach((point) => {
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  });
  
  // Handle edge case where no valid nodes were found
  if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
    console.warn("Grid generation: No valid nodes found for grid creation");
    return new Grid(10, 10); // Return a small default grid
  }
  
  const buffer = gridSize * 2;
  minX -= buffer;
  minY -= buffer;
  maxX += buffer;
  maxY += buffer;

  const gridWidth = Math.ceil((maxX - minX) / gridSize);
  const gridHeight = Math.ceil((maxY - minY) / gridSize);
  
  // Ensure minimum grid size
  const finalGridWidth = Math.max(1, gridWidth);
  const finalGridHeight = Math.max(1, gridHeight);
  
  const grid = new Grid(finalGridWidth, finalGridHeight);

  nodes.forEach((node) => {
    const { position, width, height } = node;
    if (!width || !height || !position) return;
    
    // Ensure position values are finite numbers
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      console.warn(`Grid obstacle setting: Node ${node.id} has invalid position:`, position);
      return;
    }

    const startX = Math.floor((position.x - minX - nodePadding) / gridSize);
    const startY = Math.floor((position.y - minY - nodePadding) / gridSize);
    const endX = Math.ceil((position.x - minX + width + nodePadding) / gridSize);
    const endY = Math.ceil((position.y - minY + height + nodePadding) / gridSize);

    // Clamp coordinates to grid bounds
    const clampedStartX = Math.max(0, startX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndX = Math.min(finalGridWidth, endX);
    const clampedEndY = Math.min(finalGridHeight, endY);

    for (let y = clampedStartY; y < clampedEndY; y++) {
      for (let x = clampedStartX; x < clampedEndX; x++) {
        if (grid.isInside(x, y)) {
          grid.setWalkableAt(x, y, false);
        }
      }
    }
  });

  (grid as any).originOffset = { x: minX, y: minY };

  return grid;
}