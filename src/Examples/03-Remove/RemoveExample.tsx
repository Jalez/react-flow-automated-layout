import { useCallback } from 'react';
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
  const [nodes, _, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );


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
      {nodes.length && (
        <LayoutProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
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