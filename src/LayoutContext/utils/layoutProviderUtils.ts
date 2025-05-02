import { Edge, Node, Position } from '@xyflow/react';
import { LayoutDirection } from '../context/LayoutContext';
import { Direction } from '../core/HierarchicalLayoutOrganizer';

/**
 * Convert direction from our API format to the format expected by layout engines
 */
export const convertDirection = (dir: LayoutDirection): Direction => {
  switch (dir) {
    case 'DOWN': return 'TB';
    case 'RIGHT': return 'LR';
    case 'UP': return 'BT';
    case 'LEFT': return 'RL';
    default: return 'TB';
  }
};

//opposite conversion
export const convertDirectionToLayout = (dir: Direction): LayoutDirection => {
  switch (dir) {
    case 'TB': return 'DOWN';
    case 'LR': return 'RIGHT';
    case 'BT': return 'UP';
    case 'RL': return 'LEFT';
    default: return 'DOWN';
  }
}

/**
 * Update node handle positions based on current direction
 */
export const updateHandlePositions = (
  nodes: Node[], 
  direction: LayoutDirection
): Node[] => {
  // Determine appropriate source and target positions based on direction
  const sourcePosition = getSourcePosition(direction);
  const targetPosition = getTargetPosition(direction);

  // Check if handle positions actually need to be updated
  const needsUpdate = nodes.some(
    (node) => node.sourcePosition !== sourcePosition || node.targetPosition !== targetPosition
  );

  // Only update if necessary
  if (needsUpdate) {
    return nodes.map((node) => ({
      ...node,
      sourcePosition,
      targetPosition,
    }));
  }
  return nodes;
};

/**
 * Default parent resizing options
 */
export const DEFAULT_PARENT_RESIZING_OPTIONS = {
  enabled: true,
  padding: {
    horizontal: 80,
    vertical: 48,
  },
  respectHeaderHeight: true,
  minWidth: 200,
  minHeight: 100,
};

// Simple functions to determine source and target positions based on direction
export const getSourcePosition = (direction: LayoutDirection): Position => {
    switch (direction) {
        case 'DOWN': return Position.Bottom;
        case 'RIGHT': return Position.Right;
        case 'UP': return Position.Top;
        case 'LEFT': return Position.Left;
        default: return Position.Bottom;
    }
};

export const getTargetPosition = (direction: LayoutDirection): Position => {
    switch (direction) {
        case 'DOWN': return Position.Top;
        case 'RIGHT': return Position.Left;
        case 'UP': return Position.Bottom;
        case 'LEFT': return Position.Right;
        default: return Position.Top;
    }
};

/**
 * Utility to filter visible nodes and edges based on the layoutHidden flag.
 * If layoutHidden is false, only visible nodes/edges are included.
 * If layoutHidden is true, all nodes/edges are included.
 */
export function filterVisibleNodesAndEdges(
  nodes: Node[],
  edges: Edge[],
  layoutHidden: boolean
): { nodes: Node[]; edges: Edge[] } {
  if (layoutHidden) {
    return { nodes, edges };
  }
  const visibleNodes = nodes.filter(node => !node.hidden);
  const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(
    edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
  return { nodes: visibleNodes, edges: visibleEdges };
}
