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
    const [parentIdWithNodes, setParentIdWithNodes] = useState<Map<string, Node[]>>(new Map());
    const [nodeIdWithNode, setNodeIdWithNode] = useState<Map<string, Node>>(new Map());
    useEffect(() => {
        //Go through all nodes and check if the parentId is in the map.
        const newParentIdWithNodes = new Map<string, Node[]>();
        const nodeIdWithNode = new Map<string, Node>();
        nodes.forEach((node) => {
            const parentId = node.parentId || "no-parent";
            nodeIdWithNode.set(node.id, node);
            if (!newParentIdWithNodes.has(parentId)) {
                newParentIdWithNodes.set(parentId, []);
            }
            //If its not already in the map, push it there 
            if (!newParentIdWithNodes.get(parentId)?.some((n) => n.id === node.id)) {
                newParentIdWithNodes.get(parentId)?.push(node);
            }
            //if node has oldParentId, remove it from the old parentId
            if (node.data.oldParentId) {
                const oldParentId = node.data.oldParentId;
                if (newParentIdWithNodes.has(oldParentId)) {
                    const oldParentNodes = newParentIdWithNodes.get(oldParentId);
                    if (oldParentNodes) {
                        const index = oldParentNodes.findIndex((n) => n.id === node.id);
                        if (index !== -1) {
                            oldParentNodes.splice(index, 1);
                        }
                    }
                }
            }
        }
        );
        // Update the parentIdWithNodes state
        setParentIdWithNodes(newParentIdWithNodes);
        setNodeIdWithNode(nodeIdWithNode);
        
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

    // Update the layout maps when nodes change - simplified
    useEffect(() => {
        if (nodes.length === 0) return;
        const parentIdWithNodes = new Map<string, Node[]>();
        const nodeIdWithNode = new Map<string, Node>();
        const parentIdWithChildSet = new Map<string, Set<string>>();

        nodes.forEach((node) => {
            nodeIdWithNode.set(node.id, node);

            const parentId = node.parentId || "no-parent";
            if (!parentIdWithNodes.has(parentId)) {
                parentIdWithNodes.set(parentId, []);
            }
            parentIdWithNodes.get(parentId)?.push(node);
            if (!parentIdWithChildSet.has(parentId)) {
                parentIdWithChildSet.set(parentId, new Set());
            }
            parentIdWithChildSet.get(parentId)?.add(node.id);
        });

        setParentIdWithNodes(parentIdWithNodes);
        setNodeIdWithNode(nodeIdWithNode);
    }, []);

    // Callbacks for LayoutProvider
    const updateNodesHandler = useCallback((updatedNodes: Node[]) => {
        setNodes(updatedNodes as any[]); 
    }, [setNodes, nodes]);

    return (
        nodes.length > 0 && (
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
            
                parentIdWithNodes={parentIdWithNodes}
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
        )
    );
};

export default ParentSwitchExample;