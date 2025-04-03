import { useCallback, useState, useEffect } from 'react';
import {
    Background,
    ReactFlow,
    addEdge,
    ConnectionLineType,
    Panel,
    useNodesState,
    useEdgesState,
    Connection,
    Node,
    Edge,

} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges, parentNode, parentNodesSibling, parentNodesParent } from './initialElements';
import { LayoutElementsWithDagre } from './LayoutElementsWithDagre';
import { createChildNodesToNode, fixNodeDimensions } from './utils';

type Direction = 'TB' | 'LR';


const MARGIN = 10;

export const DagreFlow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [direction, setDirection] = useState<Direction>('TB');
    const [childNodesInitialized, setChildNodesInitialized] = useState(false);

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

    const getNode = (id: string): Node | undefined => {
        return nodes.find((node) => node.id === id);
    }
    const getChildrenOfParent = (parentId: string) => {
        return nodes.filter((node: Node) => node.parentId === parentId);
    }

    const getEdgesOfNodes = (nodes: Node[]) => {
        return edges.filter((edge) => {
            return nodes.some((node) => {
                return edge.source === node.id || edge.target === node.id;
            });
        });
    }

    const RecursiveLayoutContainerOrganizer = (containerId: string, direction: Direction): { updatedNodes: Node[], updatedEdges: Edge[] } => {
        const nodesToLayout = getChildrenOfParent(containerId);
        const edgesToLayout = getEdgesOfNodes(nodesToLayout);
        console.log('nodesToLayout', nodesToLayout);
        console.log('edgesToLayout', edgesToLayout);

        const { nodes: layoutedNodes, edges: layoutedEdges, width, height } =
            LayoutElementsWithDagre(nodesToLayout, edgesToLayout, direction, MARGIN);
        let PN = getNode(containerId);
        if (!PN) {
            return { updatedNodes: layoutedNodes, updatedEdges: layoutedEdges };
        }
        //Find the parent node and update its dimensions
        PN = fixNodeDimensions(PN, width, height);
        console.log('PN', PN);

        if(!PN.parentId) {
            return { updatedNodes: [{...PN},...layoutedNodes], updatedEdges: layoutedEdges };
        }

        const {updatedNodes: parentUpdatedNodes, updatedEdges: parentUpdatedEdges} = RecursiveLayoutContainerOrganizer(PN.parentId, direction);

        return {
            updatedNodes: [...parentUpdatedNodes, ...layoutedNodes],
            updatedEdges: [...parentUpdatedEdges, ...layoutedEdges],
        };
    }

    const onLayout = useCallback(
        (direction: 'TB' | 'LR', parentNodeId: string) => {

            setDirection(direction);

            const { updatedNodes, updatedEdges } = RecursiveLayoutContainerOrganizer(parentNodeId, direction);

            console.log('updatedNodes', updatedNodes);
            //filter out the parent node from the layouted nodes
            setNodes([...updatedNodes] as any[]);
            setEdges(updatedEdges as any[]);
        },
        [nodes, edges, setNodes, setEdges],
    );

    // Run initial layout on component mount
    useEffect(() => {
        const updatedNodes = createChildNodesToNode(nodes, parentNode)
        setNodes([parentNodesParent, parentNodesSibling, parentNode, ...updatedNodes] as any[]);
        setChildNodesInitialized(true);
    }, []);

    useEffect(() => {
        if (childNodesInitialized) {
            onLayout(direction, parentNode.id)
        }
    }, [childNodesInitialized]);

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                style={{ backgroundColor: "#F7F9FB" }}
            >
                <Panel position="top-right">
                    <button onClick={() => onLayout('TB', parentNode.id)}>vertical layout</button>
                    <button onClick={() => onLayout('LR', parentNode.id)}>horizontal layout</button>
                </Panel>
                <Background />
            </ReactFlow>


        </>
    );
};