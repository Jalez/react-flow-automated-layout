import { useCallback, useRef } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { filterVisibleNodesAndEdges } from '../utils/layoutProviderUtils';

interface UseLayoutOperationsProps {
    nodes: Node[];
    edges: Edge[];
    selectedNodes: Node[];
    layoutHidden: boolean;
    calculateLayout: (nodes: Node[], edges: Edge[], selectedNodes: Node[], signal: AbortSignal) => Promise<{ nodes: Node[]; edges: Edge[] }>;
    updateNodes?: (nodes: Node[]) => void;
    updateEdges?: (edges: Edge[]) => void;
    setLayoutInProgress: (inProgress: boolean) => void;
    setNodeSpacing: (spacing: number) => void;
    setLayerSpacing: (spacing: number) => void;
}

export function useLayoutOperations({
    nodes,
    edges,
    selectedNodes,
    layoutHidden,
    calculateLayout,
    updateNodes,
    updateEdges,
    setLayoutInProgress,
    setNodeSpacing,
    setLayerSpacing
}: UseLayoutOperationsProps) {
    const reactFlowInstance = useReactFlow();
    const currentLayoutAbortControllerRef = useRef<AbortController | null>(null);
    const pendingSpacingUpdateRef = useRef<{ node?: number, layer?: number } | null>(null);

    const applyLayout = useCallback(async (
        inputNodes: Node[] = [],
        inputEdges: Edge[] = []
    ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
        if (currentLayoutAbortControllerRef.current) {
            currentLayoutAbortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        currentLayoutAbortControllerRef.current = abortController;

        const nodesData = inputNodes.length > 0 ? inputNodes : nodes;
        const edgesData = inputEdges.length > 0 ? inputEdges : edges;
        
        if (nodesData.length === 0) {
            return { nodes: nodesData, edges: edgesData };
        }

        try {
            setLayoutInProgress(true);
            
            if (abortController.signal.aborted) {
                return { nodes: nodesData, edges: edgesData };
            }

            const { nodes: filteredNodes, edges: filteredEdges } = filterVisibleNodesAndEdges(nodesData, edgesData, layoutHidden);
            
            const result = await calculateLayout(filteredNodes, filteredEdges, selectedNodes, abortController.signal);
            
            if (abortController.signal.aborted) {
                return { nodes: nodesData, edges: edgesData };
            }

            if (currentLayoutAbortControllerRef.current === abortController) {
                if (updateNodes) {
                    updateNodes(result.nodes);
                } 
                else if (reactFlowInstance?.setNodes) {
                    reactFlowInstance.setNodes(result.nodes);
                }

                if (updateEdges) {
                    updateEdges(result.edges);
                } else if (reactFlowInstance?.setEdges) {
                    reactFlowInstance.setEdges(result.edges);
                }

                if (pendingSpacingUpdateRef.current) {
                    if (pendingSpacingUpdateRef.current.node !== undefined) {
                        setNodeSpacing(pendingSpacingUpdateRef.current.node);
                    }
                    if (pendingSpacingUpdateRef.current.layer !== undefined) {
                        setLayerSpacing(pendingSpacingUpdateRef.current.layer);
                    }
                    pendingSpacingUpdateRef.current = null;
                }
            }

            return result;
        } catch (error) {
            if (!abortController.signal.aborted) {
                console.error("Error applying layout:", error);
            }
            return { nodes: nodesData, edges: edgesData };
        } finally {
            if (currentLayoutAbortControllerRef.current === abortController) {
                setLayoutInProgress(false);
                currentLayoutAbortControllerRef.current = null;
            }
        }
    }, [
        nodes,
        edges,
        selectedNodes,
        calculateLayout,
        updateNodes,
        updateEdges,
        reactFlowInstance,
        layoutHidden,
        setLayoutInProgress,
        setNodeSpacing,
        setLayerSpacing
    ]);

    return {
        applyLayout,
        pendingSpacingUpdateRef
    };
}