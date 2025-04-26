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
        height: 100,}
        
    }))
].map(node => ({
    ...node,
    type: node.type || 'default',
    position: node.position || { x: 0, y: 0 },
}));

const ParentSwitchExample = () => {

    // Initialize states
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<SwitchableNodeData >>(createInitialNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
    const [nodeParentIdMapWithChildIdSet, setNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());
    const [isInitialized, setIsInitialized] = useState(false);

    // Update nodes handler that matches what LayoutProvider expects
    const updateNodesHandler = useCallback((updatedNodes: Node[]) => {
        setNodes(updatedNodes as Node<SwitchableNodeData>[]);
        
        // Update our relationship maps
        const updatedNodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
        const updatedNodeIdWithNode = new Map<string, Node>();
        
        updatedNodes.forEach((node) => {
            updatedNodeIdWithNode.set(node.id, node);
            
            const parentId = node.parentId || "no-parent";
            if (!updatedNodeParentIdMapWithChildIdSet.has(parentId)) {
                updatedNodeParentIdMapWithChildIdSet.set(parentId, new Set());
            }
            updatedNodeParentIdMapWithChildIdSet.get(parentId)!.add(node.id);
        });
        
        setNodeParentIdMapWithChildIdSet(updatedNodeParentIdMapWithChildIdSet);
        setNodeIdWithNode(updatedNodeIdWithNode);
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
    }, [nodes, isInitialized]);

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

    // Update the layout maps when nodes change - simplified
    useEffect(() => {
        if (nodes.length === 0) return;
        const newNodeIdWithNode = new Map<string, Node>();
        const parentIdWithChildSet = new Map<string, Set<string>>();

        nodes.forEach((node) => {
            newNodeIdWithNode.set(node.id, node);

            const parentId = node.parentId || "no-parent";
            if (!parentIdWithChildSet.has(parentId)) {
                parentIdWithChildSet.set(parentId, new Set());
            }
            parentIdWithChildSet.get(parentId)?.add(node.id);
        });

        setNodeIdWithNode(newNodeIdWithNode);
    }, []);

    if(nodes.length === 0) {
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