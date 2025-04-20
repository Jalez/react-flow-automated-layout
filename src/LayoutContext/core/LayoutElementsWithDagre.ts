import { Edge, Node } from "@xyflow/react";

import dagre from '@dagrejs/dagre';
import { Direction } from "./HierarchicalLayoutOrganizer";
import { convertDirectionToLayout, getSourcePosition, getTargetPosition } from "../utils/layoutProviderUtils";

// Default values moved to variable references, will be overridden by parameters
const DEFAULT_NODE_WIDTH = 172;
const DEFAULT_NODE_HEIGHT = 36;

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
}

export const calculateLayoutWithDagre = (
  nodes: Node[],
  edges: Edge[],
  direction: Direction,
  margin = 0,
  nodeSpacing: number = 50,
  layerSpacing: number = 50,
  defaultNodeWidth: number = DEFAULT_NODE_WIDTH,
  defaultNodeHeight: number = DEFAULT_NODE_HEIGHT
): LayoutResult => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    marginx: margin,
    marginy: margin,
    nodesep: nodeSpacing,        // Horizontal spacing between nodes within the same layer
    ranksep: layerSpacing,       // Vertical spacing between layers
    edgesep: Math.max(20, nodeSpacing / 4),  // Spacing between edges
    ranker: 'network-simplex'    // Use network simplex algorithm for better results
  });

  nodes.forEach((node: Node) => {
    // Use actual node dimensions from style or fall back to configurable defaults
    const width = Number(node.style?.width) || defaultNodeWidth;
    const height = Number(node.style?.height) || defaultNodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge: Edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const graphWidth = dagreGraph.graph().width || 0;
  const graphHeight = dagreGraph.graph().height || 0;

  const sourcePosition = getSourcePosition(convertDirectionToLayout(direction));
  const targetPosition = getTargetPosition(convertDirectionToLayout(direction));

  const newNodes = nodes.map((node: Node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Get dimensions used by Dagre for this node
    const { width: dagreWidth, height: dagreHeight } = nodeWithPosition;
    const newNode = {
      ...node,
      targetPosition: targetPosition,
      sourcePosition: sourcePosition,
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


