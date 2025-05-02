import { useCallback } from 'react';
import {
    Background,
    ReactFlow,
    addEdge,
    ConnectionLineType,
    useNodesState,
    useEdgesState,
    Connection,
    Node,
    Edge,
    Panel,
    NodeTypes,
    NodeChange,
    applyNodeChanges,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges, parentContainers } from './initialElements';
import { LayoutProvider, LayoutControls } from '../../LayoutContext';
import SwitchableNode, { SwitchableNodeData } from './components/SwitchableNode';

const nodeTypes: NodeTypes = {
    switchable: SwitchableNode,
};

// Helper to create initial nodes with proper structure
const createInitialNodes = () => [
    ...parentContainers,
    ...initialNodes.map(node => ({
        ...node,
        id: node.id,
        type: node.type,
        data: {
            label: node.data.label,
        },
        position: node.position,
        parentId: node.parentId,
        extent: node.extent,
        style: {
            width: 200,
            height: 100,
        }

    }))
].map(node => ({
    ...node,
    type: node.type || 'default',
    position: node.position || { x: 0, y: 0 },
}));

const ParentSwitchExample = () => {

    // Initialize states
    const [nodes, setNodes] = useNodesState<Node<SwitchableNodeData>>(createInitialNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

    // Custom onNodesChange handler that handles parent changes and updates relationships
    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const nextNodes = applyNodeChanges(changes, nodes) as Node<SwitchableNodeData>[];
        setNodes(nextNodes);
    }, [nodes]);


    // Handle edge connections
    const onConnect = useCallback(
        (params: Connection) => {
            const edge: Edge = {
                ...params,
                id: `e${params.source}-${params.target}`,
                type: ConnectionLineType.SmoothStep,
                animated: true,
            };
            setEdges((eds) => addEdge(edge, eds));
        },
        [setEdges],
    );

    if (nodes.length === 0) {
        return null; // or a loading spinner
    }
    return (
        <LayoutProvider>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
            >
                <Panel position="top-right">
                    <LayoutControls/>
                </Panel>
                <Background />
            </ReactFlow>
        </LayoutProvider>
    );
};

export default ParentSwitchExample;