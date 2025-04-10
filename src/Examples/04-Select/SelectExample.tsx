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
    useOnSelectionChange,
    Panel,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges, parentNode, parentNodesSibling, parentNodesParent, initialNodes2 } from './initialElements';
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
const SelectFlowLayout = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [childNodesInitialized, setChildNodesInitialized] = useState(false);
    const [parentIdWithNodes, setParentIdWithNodes] = useState<Map<string, Node[]>>(new Map());
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

        // Create parent-child relationship maps
        const parentIdWithNodes = new Map<string, Node[]>();
        const nodeIdWithNode = new Map<string, Node>();

        allNodes.forEach((node) => {
            // Add to node lookup map
            nodeIdWithNode.set(node.id, node);

            // Add to appropriate parent's children list
            if (node.parentId) {
                if (!parentIdWithNodes.has(node.parentId)) {
                    parentIdWithNodes.set(node.parentId, []);
                }
                parentIdWithNodes.get(node.parentId)?.push(node);
            } else {
                if (!parentIdWithNodes.has("no-parent")) {
                    parentIdWithNodes.set("no-parent", []);
                }
                parentIdWithNodes.get("no-parent")?.push(node);
            }
        });
        setParentIdWithNodes(parentIdWithNodes);
        setNodeIdWithNode(nodeIdWithNode);
        setChildNodesInitialized(true);
    }, []);

    

    // Render the ReactFlow component with our LayoutProvider
    return (
        <>
            {childNodesInitialized && (
                <LayoutProvider
                    initialDirection="DOWN"
                    initialAutoLayout={false}
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
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        fitView
                    >
                        <Panel position="top-left">
                            <SelectionDisplay 
                             />
                        </Panel>
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


function SelectionDisplay() {

    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(({ nodes }: { nodes: Node[];}) => {
        setSelectedNodes(nodes);
    }, []);

    useOnSelectionChange({
        onChange,
    });

    return (
            <p>Ids of selected nodes: {selectedNodes.map((node: Node) => node.id).join(', ')}</p>
        
    );
}

export default SelectFlowLayout;