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
    const [nodeParentIdMapWithChildIdSet, setNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());
    const [isInitialized, setIsInitialized] = useState(false);

    // Custom onNodesChange handler that handles parent changes and updates relationships
    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const nextNodes = applyNodeChanges(changes, nodes) as Node<SwitchableNodeData>[];
        const updatedNodeMap = new Map<string, Node>();
        const updatedParentIdMapWithChildIdSet = new Map<string, Set<string>>(nodeParentIdMapWithChildIdSet);
        // Check for parent changes by comparing before and after
        nextNodes.forEach(node => {
            updatedNodeMap.set(node.id, node);
            const oldParentId = nodeIdWithNode.get(node.id)?.parentId;
            const newParentId = node.parentId;

            // If parent has changed, update the relationship maps
            if (oldParentId !== newParentId) {
                const effectiveOldParentId = oldParentId || 'no-parent';
                if (updatedParentIdMapWithChildIdSet.has(effectiveOldParentId)) {
                    const oldParentChildren = updatedParentIdMapWithChildIdSet.get(effectiveOldParentId)!;
                    oldParentChildren.delete(node.id);
                }

                const effectiveNewParentId = newParentId || 'no-parent';

                if (!updatedParentIdMapWithChildIdSet.has(effectiveNewParentId)) {
                    updatedParentIdMapWithChildIdSet.set(effectiveNewParentId, new Set());
                }
                updatedParentIdMapWithChildIdSet.get(effectiveNewParentId)!.add(node.id);

            }
        });

        setNodeParentIdMapWithChildIdSet(updatedParentIdMapWithChildIdSet);
        setNodeIdWithNode(updatedNodeMap);
        setNodes(nextNodes);

    }, [nodes, nodeParentIdMapWithChildIdSet, nodeIdWithNode]);

    // Update nodes handler that matches what LayoutProvider expects
    const updateNodesHandler = useCallback((updatedNodes: Node[]) => {
        setNodes(updatedNodes as Node<SwitchableNodeData>[]);

        // Update nodeIdWithNode with the new nodes
        const newNodeIdWithNode = new Map<string, Node>();
        updatedNodes.forEach((node) => {
            newNodeIdWithNode.set(node.id, node);
        });
        setNodeIdWithNode(newNodeIdWithNode);

        // Parent-child relationships are managed in onNodesChange
    }, [setNodes]);

    // Initialize the parent-child relationships
    useEffect(() => {
        if (isInitialized) return;

        // Create parent-child relationship maps using the Set-based structure
        const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
        const nodeIdWithNode = new Map<string, Node>();

        nodes.forEach((node) => {
            // Add to node lookup map
            nodeIdWithNode.set(node.id, node);

            // Add to appropriate parent's children set
            const parentId = node.parentId || "no-parent";
            if (!nodeParentIdMapWithChildIdSet.has(parentId)) {
                nodeParentIdMapWithChildIdSet.set(parentId, new Set());
            }
            nodeParentIdMapWithChildIdSet.get(parentId)!.add(node.id);
        });

        setNodeParentIdMapWithChildIdSet(nodeParentIdMapWithChildIdSet);
        setNodeIdWithNode(nodeIdWithNode);
        setIsInitialized(true);
    }, []);

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
        return <div style={{ width: '100%', height: '100%' }}></div>;
    }
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isInitialized && (
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
                        respectHeaderHeight: true
                    }}
                    updateNodes={updateNodesHandler}
                    nodeParentIdMapWithChildIdSet={nodeParentIdMapWithChildIdSet}
                    nodeIdWithNode={nodeIdWithNode}
                >
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
                            <LayoutControls
                                showDirectionControls={true}
                                showAutoLayoutToggle={true}
                                showSpacingControls={true}
                                showApplyLayoutButton={true}
                            />
                        </Panel>
                        <Background />
                    </ReactFlow>
                </LayoutProvider>
            )}
        </div>
    );
};

export default ParentSwitchExample;