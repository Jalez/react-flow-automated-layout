import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  Node,
  Edge,
  Connection,
  Controls,
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import { 
  LayoutProvider, 
  LayoutControls, 
} from '../../LayoutContext';
 
// Define the node data type to satisfy Record<string, unknown>
interface NodeData extends Record<string, unknown> {
  label?: string;
}

const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'input',
    data: { label: "You.." },
    position: { x: -150, y: 0 },
  },
  {
    id: '2',
    type: 'input',
    data: { label: '...can...' },
    position: { x: 150, y: 0 },
  },
  { id: '3', data: { label: 'Delete me.' }, position: { x: 0, y: 100 } },
  { id: '4', data: { label: 'Or me!' }, position: { x: 0, y: 200 } },
  {
    id: '5',
    type: 'output',
    data: { label: 'Me too!' },
    position: { x: 0, y: 300 },
  },
];
 
const initialEdges: Edge[] = [
  { id: '1->3', source: '1', target: '3' },
  { id: '2->3', source: '2', target: '3' },
  { id: '3->4', source: '3', target: '4' },
  { id: '4->5', source: '4', target: '5' },
];
 
export default function RemoveFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [childNodesInitialized, setChildNodesInitialized] = useState(false);
  const [parentIdWithNodes, setParentIdWithNodes] = useState<Map<string, Node[]>>(new Map());
  const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());
 
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  // Initialize the parent-child relationships
  useEffect(() => {
    const parentIdWithNodes = new Map<string, Node[]>();
    const nodeIdWithNode = new Map<string, Node>();
    
    nodes.forEach((node) => {
      nodeIdWithNode.set(node.id, node);
      
      if (node.parentId) {
        if (!parentIdWithNodes.has(node.parentId)) {
          parentIdWithNodes.set(node.parentId, []);
        }
        parentIdWithNodes.get(node.parentId)?.push(node);
      } else {
        if(!parentIdWithNodes.has("no-parent")) {
          parentIdWithNodes.set("no-parent", []);
        }
        parentIdWithNodes.get("no-parent")?.push(node);
      }
    });        
    setParentIdWithNodes(parentIdWithNodes);
    setNodeIdWithNode(nodeIdWithNode);
    setChildNodesInitialized(true);
  }, [nodes]);

  // Update nodes handler that matches what LayoutProvider expects
  const updateNodesHandler = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, [setNodes]);

  // Update edges handler with correct type signature expected by LayoutProvider
  const updateEdgesHandler = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
  }, [setEdges]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);
 
          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge),
          );
 
          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              target,
            })),
          );
 
          return [...remainingEdges, ...createdEdges];
        }, edges),
      );
    },
    [nodes, edges],
  );
 
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {childNodesInitialized && (
        <LayoutProvider
          initialDirection="DOWN"
          initialAutoLayout={true}
          initialPadding={50}
          initialSpacing={{ node: 50, layer: 50 }}
          initialParentResizingOptions={{
            padding: {
              horizontal: 50,
              vertical: 40,
            },
            minWidth: 150,
            minHeight: 150,
          }}
          updateNodes={updateNodesHandler}
          updateEdges={updateEdgesHandler}
          parentIdWithNodes={parentIdWithNodes}
          nodeIdWithNode={nodeIdWithNode}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            style={{ backgroundColor: "#F7F9FB" }}
          >
            <Background />
            <Controls position="top-right">

            <LayoutControls 
              showDirectionControls={true}
              showAutoLayoutToggle={true}
              showSpacingControls={true}
              showApplyLayoutButton={true}
              />
              </Controls>
          </ReactFlow>
        </LayoutProvider>
      )}
    </div>
  );
}