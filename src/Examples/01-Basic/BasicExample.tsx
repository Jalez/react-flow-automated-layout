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
    Controls,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges, parentNode, parentNodesSibling, parentNodesParent } from '../04-Select/initialElements';
import { 
    LayoutProvider, 
    LayoutControls, 

} from '../../LayoutContext';

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

// Main component using the new LayoutContext
const BasicFlowLayout = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [childNodesInitialized, setChildNodesInitialized] = useState(false);

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
        const updatedNodes = createChildNodesToNode(nodes, parentNode);
        const allNodes = [parentNodesParent, parentNodesSibling, parentNode, ...updatedNodes] as any[];
        setNodes(allNodes);

        setChildNodesInitialized(true);
    }, []);

    // Render the ReactFlow component with our LayoutProvider
    return (
        <>
            {childNodesInitialized && (
                <LayoutProvider
                    updateNodes={updateNodesHandler}
                    updateEdges={updateEdgesHandler}
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
                        <Controls position="top-right">
                            <LayoutControls 
                                showDirectionControls={true}
                                showAutoLayoutToggle={true}
                                showSpacingControls={true}
                                showApplyLayoutButton={true}
                            />
                        </Controls>    
                        <Background />
                    </ReactFlow>
                </LayoutProvider>
            )}
        </>
    );
};


export default BasicFlowLayout;