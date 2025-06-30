import { Edge, Node } from "@xyflow/react";
import dagre from '@dagrejs/dagre';
import { Direction } from "./HierarchicalLayoutOrganizer";
import { convertDirectionToLayout, getSourcePosition, getTargetPosition } from "../utils/layoutProviderUtils";

export const DEFAULT_NODE_WIDTH = 172;
export const DEFAULT_NODE_HEIGHT = 36;
// amount of invisible padding around each node to act as obstacle
const PADDING = 20;


export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
}

export const calculateLayoutWithDagre = async (
  nodes: Node[],
  edges: Edge[],
  direction: Direction,
  margin = 0,
  nodeSpacing: number = 50,
  layerSpacing: number = 50,
  defaultNodeWidth: number = DEFAULT_NODE_WIDTH,
  defaultNodeHeight: number = DEFAULT_NODE_HEIGHT,
  includeHidden: boolean = false,
  cyclicEdges: Edge[] = []
): Promise<LayoutResult> => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    marginx: margin,
    marginy: margin,
    nodesep: nodeSpacing + PADDING,
    ranksep: layerSpacing + PADDING,
    edgesep: Math.max(20, nodeSpacing / 4) + PADDING,
    ranker: 'tight-tree',
  });

  // filter hidden
  const nodesToLayout = includeHidden
    ? nodes
    : nodes.filter(n => !n.hidden);
  if (nodesToLayout.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  // add nodes with padding
  nodesToLayout.forEach(node => {
    const width = Number(node.style?.width) || defaultNodeWidth;
    const height = Number(node.style?.height) || defaultNodeHeight;
    dagreGraph.setNode(node.id, { width: width + PADDING * 2, height: height + PADDING * 2 });
  });

  // add normal edges
  edges.forEach(edge => {
    const sourceHandle = edge.sourceHandle;
    const targetHandle = edge.targetHandle;
    let edgeOptions = {};
    if (sourceHandle === 'right' && targetHandle === 'left') {
      edgeOptions = { constraint: false, minlen: 1 };
    } else if (sourceHandle === 'bottom' && targetHandle === 'top') {
      edgeOptions = { constraint: true, minlen: 1 };
    } else {
      edgeOptions = { constraint: true, minlen: 2 };
    }
    dagreGraph.setEdge(edge.source, edge.target, edgeOptions);
  });

  // add cyclic edges with no constraint so they don't affect layout but get routed
  cyclicEdges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target, { 
      constraint: false, 
      minlen: 0,
      weight: 0 
    });
  });

  // run layout
  dagre.layout(dagreGraph);

  const graphWidth = dagreGraph.graph().width || 0;
  const graphHeight = dagreGraph.graph().height || 0;

  const sourcePosition = getSourcePosition(convertDirectionToLayout(direction));
  const targetPosition = getTargetPosition(convertDirectionToLayout(direction));

  // map back to React Flow nodes
  const newNodes = nodesToLayout.map(node => {
    const dgNode = dagreGraph.node(node.id);
    const realWidth = Number(node.style?.width) || defaultNodeWidth;
    const realHeight = Number(node.style?.height) || defaultNodeHeight;
    const w = realWidth;
    const h = realHeight;
    const base: any = {
      ...node,
      sourcePosition,
      targetPosition,
      selected: false,
    };
    const cx = dgNode.x;
    const cy = dgNode.y;
    switch (node.data?.positionType) {
      case 'center':
        base.position = { x: cx, y: cy };
        break;
      case 'topRight':
        base.position = { x: cx + w / 2, y: cy - h / 2 };
        break;
      case 'bottomLeft':
        base.position = { x: cx - w / 2, y: cy + h / 2 };
        break;
      case 'bottomRight':
        base.position = { x: cx + w / 2, y: cy + h / 2 };
        break;
      case 'topLeft':
      default:
        base.position = { x: cx - w / 2, y: cy - h / 2 };
    }
    return base as Node;
  });

  // build routed edges from dagre points
  const smartCyclicEdges: Edge[] = cyclicEdges.map(edge => ({
   ...edge,
    type: 'smart',
  }));

  return {
    nodes: newNodes,
    edges: smartCyclicEdges,
    width: graphWidth,
    height: graphHeight,
  };
};
