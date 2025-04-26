import { useCallback, useState, useEffect } from 'react';
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
    Panel
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, initialNodes2, initialEdges, parentNode, parentNodesSibling, parentNodesParent } from './initialElements';
import { 
    LayoutProvider, 
} from '../../LayoutContext';

// Custom controls components
import CustomLayoutControls from './components/CustomLayoutControls';

// Helper function to assign child nodes to their parent
const createChildNodesToNode = (
    nodes: Node[],
    parentNode: Node
): Node[] => {
    return nodes.map((node: Node) => {
        if (node.id === parentNode.id) {
            return node;
        }
        return {
            ...node,
            parentId: parentNode.id,
            extent: 'parent' as const,
        };
    });
};

// Main component using the new LayoutContext with custom controls
const CustomControlsExample = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [childNodesInitialized, setChildNodesInitialized] = useState(false);
    const [nodeParentIdMapWithChildIdSet, setNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());

    // Handle edge connections
    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    { ...params, type: ConnectionLineType.SmoothStep, animated: true },
                    eds,
                ),
            ),
        [],
    );

    // Update nodes handler that matches what LayoutProvider expects
    const updateNodesHandler = useCallback((newNodes: Node[]) => {
        setNodes(newNodes as any[]);
    }, [setNodes]);

    // Update edges handler with correct type signature expected by LayoutProvider
    const updateEdgesHandler = useCallback((newEdges: Edge[]) => {
        setEdges(newEdges as any[]);
    }, [setEdges]);

    // Initialize the parent-child relationships
    useEffect(() => {
        // Create child nodes with parent relationship
        const childNodesOfParentNode = createChildNodesToNode(initialNodes, parentNode);
        const childNodesOfParentNodeSibling = createChildNodesToNode(initialNodes2, parentNodesSibling);
        const allNodes = [parentNodesParent, parentNodesSibling, parentNode, ...childNodesOfParentNode, ...childNodesOfParentNodeSibling] as any[];
        setNodes(allNodes);

        // Create parent-child relationship maps using the new Set-based structure
        const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
        const nodeIdWithNode = new Map<string, Node>();

        allNodes.forEach((node) => {
            // Add to node lookup map
            nodeIdWithNode.set(node.id, node);

            // Add to appropriate parent's children set
            const parentId = node.parentId || "no-parent";
            if (!nodeParentIdMapWithChildIdSet.has(parentId)) {
                nodeParentIdMapWithChildIdSet.set(parentId, new Set());
            }
            nodeParentIdMapWithChildIdSet.get(parentId)?.add(node.id);
        });
        setNodeParentIdMapWithChildIdSet(nodeParentIdMapWithChildIdSet);
        setNodeIdWithNode(nodeIdWithNode);
        setChildNodesInitialized(true);
    }, []);

    // Render the ReactFlow component with our LayoutProvider and custom controls
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
                    nodeParentIdMapWithChildIdSet={nodeParentIdMapWithChildIdSet}
                    nodeIdWithNode={nodeIdWithNode}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        fitView
                    >
                        {/* Place the custom controls in a panel */}
                        <Panel position="top-left" style={{ background: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 3px 6px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Custom Layout Controls</h3>
                            <CustomLayoutControls />
                        </Panel>
                        
                        <Background />
                    </ReactFlow>
                </LayoutProvider>
            )}
        </div>
    );
};

export default CustomControlsExample;