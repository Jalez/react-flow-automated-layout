import { useCallback, useState, useEffect } from 'react';
import {
    Background,
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
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
        id: '0',
        type: 'input',
        data: {},
        position: { x: 0, y: 0 },
        style: {
            background: "none",
        },

    },
    {
        id: '1',
        type: 'input',
        data: { label: 'Node' },
        position: { x: 0, y: 0 },
        parentId: '0',
    },
];

// Initial empty edges array
const initialEdges: Edge[] = [];

let id = 2;
const getId = () => `${id++}`;

const AddNodeOnEdgeDrop = () => {

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();
    const [childNodesInitialized, setChildNodesInitialized] = useState(false);
    const [nodeParentIdMapWithChildIdSet, setNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());

    // Initialize the parent-child relationships
    useEffect(() => {
        // Initialize parent-child relationship maps
        const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
        const nodeIdWithNode = new Map<string, Node>();
        
        nodes.forEach((node) => {
            // Add to node lookup map
            nodeIdWithNode.set(node.id, node);
            
            // Add to parent-child relationship map
            const parentId = node.parentId || "no-parent";
            if (!nodeParentIdMapWithChildIdSet.has(parentId)) {
                nodeParentIdMapWithChildIdSet.set(parentId, new Set());
            }
            nodeParentIdMapWithChildIdSet.get(parentId)?.add(node.id);
        });
        
        // Add each parent node type to the relationship map
        ['input', 'output', 'default'].forEach((type) => {
            if (!nodeParentIdMapWithChildIdSet.has(type)) {
                nodeParentIdMapWithChildIdSet.set(type, new Set());
            }
        });
        
        setNodeParentIdMapWithChildIdSet(nodeParentIdMapWithChildIdSet);
        setNodeIdWithNode(nodeIdWithNode);
        
        setChildNodesInitialized(true);
    }, [nodes]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [],
    );

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, connectionState: any) => {
            if (!connectionState.isValid) {
                const newId = getId();
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event;
                const newNode: Node = {
                    id: newId,
                    type: 'default',
                    position: screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    data: { label: `Node ${newId}` },
                    parentId: connectionState.fromNode.parentId,
                };

                setNodes((nds) => [...nds, newNode]);

                // Create a properly typed edge
                const newEdge: Edge = {
                    id: `e-${newId}`,
                    source: connectionState.fromNode.id,
                    target: newId
                };

                setEdges((eds) => [...eds, newEdge]);
            }
        },
        [screenToFlowPosition, setNodes, setEdges],
    );

    const updateNodesHandler = useCallback((newNodes: Node[]) => {
        setNodes(newNodes);
    }, [setNodes]);

    const updateEdgesHandler = useCallback((newEdges: Edge[]) => {
        setEdges(newEdges);
    }, [setEdges]);

    if (!childNodesInitialized) {
        return <div>Loading...</div>;
    }
    return (
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
            nodeParentIdMapWithChildIdSet={nodeParentIdMapWithChildIdSet}
            nodeIdWithNode={nodeIdWithNode}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
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

    );
};

export default () => (
    <ReactFlowProvider>
        <AddNodeOnEdgeDrop />
    </ReactFlowProvider>
);