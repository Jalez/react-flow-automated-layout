import { Edge, Position, Node } from "@xyflow/react";

import dagre from '@dagrejs/dagre';

const nodeWidth = 172;
const nodeHeight = 36;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
}

export const LayoutElementsWithDagre = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
  margin = 0,
): LayoutResult => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({
    rankdir: direction,
    marginx: margin,
    marginy: margin,
    nodesep: 50,
  });

  nodes.forEach((node: Node) => {
    // Use actual node dimensions from style or fall back to defaults
    const width = Number(node.style?.width) || nodeWidth;
    const height = Number(node.style?.height) || nodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge: Edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const graphWidth = dagreGraph.graph().width || 0;
  const graphHeight = dagreGraph.graph().height || 0;

  const newNodes = nodes.map((node: Node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Get dimensions used by Dagre for this node
    const { width: dagreWidth, height: dagreHeight } = nodeWithPosition;
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // Calculate top-left corner from Dagre's center position and dimensions
      position: {
        x: nodeWithPosition.x - dagreWidth / 2,
        y: nodeWithPosition.y - dagreHeight / 2,
      },
    };

    return newNode;
  });

  return {
    nodes: newNodes,
    edges,
    width: graphWidth,
    height: graphHeight,
  };
};
