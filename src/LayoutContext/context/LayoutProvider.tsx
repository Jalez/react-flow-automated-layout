import { ReactNode, useCallback, useEffect, useState, useRef } from 'react';
import { Edge, Node, useReactFlow, useOnSelectionChange, useNodes, useEdges } from '@xyflow/react';
import LayoutContext, {
    LayoutAlgorithm,
    LayoutContextState,
    LayoutDirection,
    LayoutEngine,
    ParentResizingOptions,
    useLayoutContext
} from './LayoutContext';
import { engines } from '../engines';
import { DEFAULT_PARENT_RESIZING_OPTIONS, filterVisibleNodesAndEdges } from '../utils/layoutProviderUtils';
import { useLayoutCalculation } from '../hooks/useLayoutCalculation';
interface LayoutProviderProps {
    children: ReactNode;
    initialDirection?: LayoutDirection;
    initialAlgorithm?: LayoutAlgorithm;
    initialAutoLayout?: boolean;
    initialPadding?: number;
    initialSpacing?: {
        node?: number;
        layer?: number;
    };
    initialNodeDimensions?: {
        width?: number;
        height?: number;
    };
    initialParentResizingOptions?: Partial<ParentResizingOptions>;
    includeHidden?: boolean;
    layoutEngines?: Record<string, LayoutEngine>;
    updateNodes?: (nodes: Node[]) => void;
    updateEdges?: (edges: Edge[]) => void;
    nodeParentIdMapWithChildIdSet?: Map<string, Set<string>>; // Now optional
    nodeIdWithNode?: Map<string, Node>; // Now optional
    noParentKey?: string; // Key for customizing the key for parentless nodes
}

/**
 * Provider component for the Layout context
 * Handles state management and layout operations
 */
export function LayoutProvider({
    children,
    initialDirection = 'DOWN',
    initialAlgorithm = 'layered',
    initialAutoLayout = true,
    initialPadding = 50,
    initialSpacing = { node: 50, layer: 50 },
    initialNodeDimensions = { width: 172, height: 36 },
    initialParentResizingOptions,
    includeHidden = false,
    layoutEngines: customEngines,
    updateNodes,
    updateEdges,
    nodeParentIdMapWithChildIdSet: externalNodeParentIdMapWithChildIdSet,
    nodeIdWithNode: externalNodeIdWithNode,
    noParentKey = 'no-parent', // Default to 'no-parent' for backward compatibility
}: LayoutProviderProps) {
    // Get ReactFlow instance
    const reactFlowInstance = useReactFlow();
    // Use useNodes and useEdges hooks to get live data
    const nodes = useNodes();
    const edges = useEdges();

    // Internal state for relationship maps when not provided externally
    const [internalNodeIdWithNode, setInternalNodeIdWithNode] = useState<Map<string, Node>>(new Map());
    const [internalNodeParentIdMapWithChildIdSet, setInternalNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    
    // Use provided maps or internal state
    const nodeIdWithNode = externalNodeIdWithNode || internalNodeIdWithNode;
    const nodeParentIdMapWithChildIdSet = externalNodeParentIdMapWithChildIdSet || internalNodeParentIdMapWithChildIdSet;
    
    // Build internal maps if external maps aren't provided
    useEffect(() => {
        // Only build internal maps if external ones aren't provided
        if (!externalNodeIdWithNode || !externalNodeParentIdMapWithChildIdSet) {
            const newNodeIdWithNode = new Map<string, Node>();
            const newNodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
            
            nodes.forEach((node) => {
                // Add to node lookup map
                newNodeIdWithNode.set(node.id, node);
                
                // Add to appropriate parent's children set
                const parentId = node.parentId || noParentKey;
                if (!newNodeParentIdMapWithChildIdSet.has(parentId)) {
                    newNodeParentIdMapWithChildIdSet.set(parentId, new Set());
                }
                newNodeParentIdMapWithChildIdSet.get(parentId)?.add(node.id);
            });
            
            if (!externalNodeIdWithNode) {
                setInternalNodeIdWithNode(newNodeIdWithNode);
            }
            
            if (!externalNodeParentIdMapWithChildIdSet) {
                setInternalNodeParentIdMapWithChildIdSet(newNodeParentIdMapWithChildIdSet);
            }
        }
    }, [nodes, externalNodeIdWithNode, externalNodeParentIdMapWithChildIdSet, noParentKey]);

    const numberOfNodes = nodeIdWithNode.size;
    // State for layout settings
    const [direction, setDirection] = useState<LayoutDirection>(initialDirection);
    const [algorithm, setAlgorithm] = useState<LayoutAlgorithm>(initialAlgorithm);
    const [autoLayout, setAutoLayout] = useState<boolean>(initialAutoLayout);
    const [layoutInProgress, setLayoutInProgress] = useState<boolean>(false);
    const [padding, setPadding] = useState<number>(initialPadding);
    const [nodeSpacing, setNodeSpacing] = useState<number>(initialSpacing.node || 150);
    const [layerSpacing, setLayerSpacing] = useState<number>(initialSpacing.layer || 180);
    const [nodeWidth, setNodeWidth] = useState<number>(initialNodeDimensions.width || 100);
    const [nodeHeight, setNodeHeight] = useState<number>(initialNodeDimensions.height || 100);
    const [layoutHidden, setLayoutHidden] = useState<boolean>(includeHidden);
    const [nodesLength, setNodesLength] = useState<number>(nodes.length);

    useEffect(() => {
        if(nodes.length !== nodesLength) {
            setNodesLength(nodes.length);
        }
    }
    , [nodes, nodeIdWithNode, nodesLength]);
    // Refs to prevent infinite loops
    const applyingLayoutRef = useRef(false);
    const pendingSpacingUpdateRef = useRef<{ node?: number, layer?: number } | null>(null);
    // Ref to track structure changes independent of node position changes
    
    // Track if parent-child structure has changed
    const [parentChildStructure, setParentChildStructure] = useState<Record<string, number>>({});

    // State for parent resizing options
    const [parentResizingOptions, setParentResizingOptionsState] = useState<ParentResizingOptions>({
        ...DEFAULT_PARENT_RESIZING_OPTIONS,
        ...initialParentResizingOptions,
        enabled: initialAutoLayout,
    });

    // State for layout engines
    const [layoutEngines, setLayoutEngines] = useState<Record<string, LayoutEngine>>({
        ...engines,
        ...customEngines,
    });

    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(({ nodes }: { nodes: Node[]; }) => {
        setSelectedNodes(nodes);
    }, []);

    useOnSelectionChange({
        onChange,
    });



    // State for layout engine options
    const [layoutEngineOptions, setLayoutEngineOptions] = useState<Record<string, any>>({});

    // Add a state to track if children are initialized
    const [childrenInitialized, setChildrenInitialized] = useState(false);

    // Use layout calculation hook
    const { calculateLayout } = useLayoutCalculation(
        layoutEngines,
        direction,
        algorithm,
        parentResizingOptions,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        layoutHidden,
        noParentKey // Pass the noParentKey to the hook
    );

    // Register a new layout engine
    const registerLayoutEngine = useCallback((name: string, engine: LayoutEngine) => {
        setLayoutEngines(prev => ({ ...prev, [name]: engine }));
    }, []);

    // Update parent resizing options
    const setParentResizingOptions = useCallback((options: Partial<ParentResizingOptions>) => {
        setParentResizingOptionsState(prev => ({
            ...prev,
            ...options,
            enabled: autoLayout,
        }));
    }, [autoLayout]);

    // Update parent resizing when autoLayout changes
    useEffect(() => {
        setParentResizingOptionsState(prev => ({
            ...prev,
            enabled: autoLayout,
        }));
    }, [autoLayout]);


    // Apply layout to nodes and edges - with safeguards against recursive calls
    const applyLayout = useCallback(async (
        inputNodes: Node[] = [],
        inputEdges: Edge[] = []
    ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
        if (layoutInProgress || applyingLayoutRef.current) {
            return { nodes: inputNodes, edges: inputEdges };
        }
        // Use the reactive nodes and edges from hooks instead of getNodes/getEdges
        const nodesData = inputNodes.length > 0 ? inputNodes : nodes;
        const edgesData = inputEdges.length > 0 ? inputEdges : edges;
        if (nodesData.length === 0) {
            return { nodes: nodesData, edges: edgesData };
        }
        // Use the new utility for filtering visible nodes/edges
        const { nodes: filteredNodes, edges: filteredEdges } = filterVisibleNodesAndEdges(nodesData, edgesData, layoutHidden);
        try {
            setLayoutInProgress(true);
            applyingLayoutRef.current = true;
            
            // calculateLayout is now async, so await its result
            const result = await calculateLayout(filteredNodes, filteredEdges, selectedNodes);
            
            // Update nodes and edges
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

            // Process any pending spacing updates that came in during layout
            if (pendingSpacingUpdateRef.current) {
                if (pendingSpacingUpdateRef.current.node !== undefined) {
                    setNodeSpacing(pendingSpacingUpdateRef.current.node);
                }
                if (pendingSpacingUpdateRef.current.layer !== undefined) {
                    setLayerSpacing(pendingSpacingUpdateRef.current.layer);
                }
                pendingSpacingUpdateRef.current = null;
            }

            return result;
        } catch (error) {
            console.error("Error applying layout:", error);
            return { nodes: nodesData, edges: edgesData };
        } finally {
            setLayoutInProgress(false);
            applyingLayoutRef.current = false;
        }
    }, [
        layoutInProgress,
        nodes, // Use nodes from hook
        edges, // Use edges from hook
        selectedNodes,
        calculateLayout,
        direction,
        updateNodes,
        updateEdges,
        reactFlowInstance,
        layoutHidden // Added layoutHidden to dependencies
    ]);

    // Effect to check when maps are populated and mark initialization complete
    useEffect(() => {
        if (nodeIdWithNode.size > 0 && nodeParentIdMapWithChildIdSet.size > 0 && !childrenInitialized) {
            setChildrenInitialized(true);
        }
    }, [nodeIdWithNode, nodeParentIdMapWithChildIdSet, childrenInitialized]);

    // Effect to update handle positions and reapply layout when autoLayout is enabled
    useEffect(() => {
        if (childrenInitialized && autoLayout) {
            // Update handle positions based on new directions
            applyLayout();
        }
    }, [childrenInitialized, autoLayout, direction, numberOfNodes, nodeSpacing, layerSpacing, parentChildStructure, nodesLength]);

    // Calculate parent-child structure signature
    useEffect(() => {
        // Generate a new structure signature based on parent IDs and their child counts
        const newStructure: Record<string, number> = {};
        nodeParentIdMapWithChildIdSet.forEach((childIdSet, parentId) => {
            newStructure[parentId] = childIdSet.size;
        });
        
        let hasChanged = false;
        //Go through the new structure and check if it has changed
        for (const key in newStructure) {
            if(!parentChildStructure.hasOwnProperty(key)) {
                hasChanged = true;
                break;
            }
            if (newStructure[key] !== parentChildStructure[key]) {
                hasChanged = true;
                break;
            }
        }
        // Update ref and state if changed
        if (hasChanged) {
            setParentChildStructure(newStructure)
        }
    }, [nodeParentIdMapWithChildIdSet]);

    // Provide the context value
    const contextValue: LayoutContextState = {
        // State
        direction,
        algorithm,
        autoLayout,
        layoutInProgress,
        padding,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        layoutHidden,
        parentResizingOptions,
        layoutEngines,
        layoutEngineOptions,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        noParentKey, // Add the noParentKey property
        updateNodes,
        updateEdges,

        // Actions
        setDirection,
        setAlgorithm,
        setAutoLayout,
        setLayoutInProgress,
        setPadding,
        setNodeSpacing,
        setLayerSpacing,
        setNodeWidth,
        setNodeHeight,
        setLayoutHidden,
        setParentResizingOptions,
        setLayoutEngineOptions,

        // Layout application
        applyLayout,
        clearLayoutCache: () => { }, // No-op function since we removed caching

        // Layout engine registration
        registerLayoutEngine,
    };

    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
        </LayoutContext.Provider>
    );
}

// Re-export the context hook for convenience
export { useLayoutContext };