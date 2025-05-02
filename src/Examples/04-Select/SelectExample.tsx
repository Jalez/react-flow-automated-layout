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
    }, []); // Remove nodes dependency to prevent infinite loop

    // Render the ReactFlow component with our LayoutProvider
    return (
        <div style={{ width: '100%', height: '100%' }}>
            {childNodesInitialized && (
                <LayoutProvider
                    initialAutoLayout={false} // You need to now manually trigger the layout
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
        </div>
    );
};


function SelectionDisplay() {

    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(({ nodes }: { nodes: Node[]; }) => {
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