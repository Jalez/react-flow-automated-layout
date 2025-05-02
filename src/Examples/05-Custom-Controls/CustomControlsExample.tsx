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

    // Initialize the parent-child relationships
    useEffect(() => {
        // Create child nodes with parent relationship
        const childNodesOfParentNode = createChildNodesToNode(initialNodes, parentNode);
        const childNodesOfParentNodeSibling = createChildNodesToNode(initialNodes2, parentNodesSibling);
        const allNodes = [parentNodesParent, parentNodesSibling, parentNode, ...childNodesOfParentNode, ...childNodesOfParentNodeSibling] as any[];
        setNodes(allNodes);
        setChildNodesInitialized(true);
    }, []);

    // Render the ReactFlow component with our LayoutProvider and custom controls
    return (
        <div style={{ width: '100%', height: '100%' }}>
            {childNodesInitialized && (
                <LayoutProvider>
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