import { Edge, Node } from "@xyflow/react";
import dagre from '@dagrejs/dagre';
import { Direction } from "./HierarchicalLayoutOrganizer";
import { convertDirectionToLayout, getSourcePosition, getTargetPosition } from "../utils/layoutProviderUtils";

const DEFAULT_NODE_WIDTH = 172;
const DEFAULT_NODE_HEIGHT = 36;

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
  includeHidden: boolean = false
): Promise<LayoutResult> => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    marginx: margin,
    marginy: margin,
    nodesep: nodeSpacing,
    ranksep: layerSpacing,
    edgesep: Math.max(20, nodeSpacing / 4),
    //When we have siblings, we want their top edges to be aligned
    ranker: 'tight-tree',
  });

  // filter hidden
  const nodesToLayout = includeHidden
    ? nodes
    : nodes.filter(n => !n.hidden);
  if (nodesToLayout.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  // add nodes
  nodesToLayout.forEach(node => {
    const width = Number(node.style?.width) || defaultNodeWidth;
    const height = Number(node.style?.height) || defaultNodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  // **add edges with port‐aware constraints**
  edges.forEach(edge => {
    const sourceHandle = edge.sourceHandle;
    const targetHandle = edge.targetHandle;
  
    let edgeOptions = {};
  
    // Case 1: Sibling (purely right -> left) - Should NOT affect rank
    if (sourceHandle === 'right' && targetHandle === 'left') {
      edgeOptions = { constraint: false, minlen: 1 };
    }
    // Case 2: Parent-Child (purely bottom -> top) - Should affect rank and force separation
    else if (sourceHandle === 'bottom' && targetHandle === 'top') {
       edgeOptions = { constraint: true, minlen: 1 }; // minlen 1 is often sufficient
    }
    // Case 3: Other Dependency (e.g., left -> right) - Could be treated as a different kind of ranking edge
    // else if (sourceHandle === 'left' && targetHandle === 'right') {
    //   edgeOptions = { constraint: true, minlen: 1 };
    // }
    // Default: Any other connection - Treat as a ranking edge with extra separation (or default minlen: 1)
    else {
        edgeOptions = { constraint: true, minlen: 2 }; // Or minlen: 1
    }
  
    dagreGraph.setEdge(edge.source, edge.target, edgeOptions);
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
    const { width: w, height: h } = dgNode;
    const base: any = {
      ...node,
      sourcePosition,
      targetPosition,
      selected: false,
    };
    console.log("USING NEW VERSION OF CALCULATE LAYOUT WITH DAGRE");
    const cx = dgNode.x, cy = dgNode.y;
    switch (node.data?.positionType) {
      case 'center':
        base.position = { x: cx, y: cy }; break;
      case 'topRight':
        base.position = { x: cx + w / 2, y: cy - h / 2 }; break;
      case 'bottomLeft':
        base.position = { x: cx - w / 2, y: cy + h / 2 }; break;
      case 'bottomRight':
        base.position = { x: cx + w / 2, y: cy + h / 2 }; break;
      case 'topLeft':
      default:
        base.position = { x: cx - w / 2, y: cy - h / 2 };
    }
    return base as Node;
  });

  return {
    nodes: newNodes,
    edges,
    width: graphWidth,
    height: graphHeight,
  };
};
