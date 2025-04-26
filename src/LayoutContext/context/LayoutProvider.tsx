import { ReactNode, useCallback, useEffect, useState, useRef } from 'react';
import { Edge, Node, useReactFlow, useOnSelectionChange } from '@xyflow/react';
import LayoutContext, {
    LayoutAlgorithm,
    LayoutContextState,
    LayoutDirection,
    LayoutEngine,
    ParentResizingOptions,
    useLayoutContext
} from './LayoutContext';
import { engines } from '../engines';
import { DEFAULT_PARENT_RESIZING_OPTIONS, getSourcePosition, getTargetPosition } from '../utils/layoutProviderUtils';
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
    initialLayoutHidden?: boolean;
    layoutEngines?: Record<string, LayoutEngine>;
    updateNodes?: (nodes: Node[]) => void;
    updateEdges?: (edges: Edge[]) => void;
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>;
    nodeIdWithNode: Map<string, Node>;
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
    initialSpacing = { node: 150, layer: 180 },
    initialNodeDimensions = { width: 172, height: 36 },
    initialParentResizingOptions,
    initialLayoutHidden = false,
    layoutEngines: customEngines,
    updateNodes,
    updateEdges,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
}: LayoutProviderProps) {
    // Get ReactFlow instance
    const reactFlowInstance = useReactFlow();

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
    const [layoutHidden, setLayoutHidden] = useState<boolean>(initialLayoutHidden);
    const { getNodes, getEdges } = useReactFlow();
    // Refs to prevent infinite loops
    const applyingLayoutRef = useRef(false);
    const pendingSpacingUpdateRef = useRef<{ node?: number, layer?: number } | null>(null);
    
    // Ref to track structure changes independent of node position changes
    
    // Track if parent-child structure has changed
    const [parentChildStructure, setParentChildStructureChanged] = useState<Record<string, number>>({});

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

    // Compute handle positions based on direction
    const sourcePosition = getSourcePosition(direction);
    const targetPosition = getTargetPosition(direction);

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
        layoutHidden
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
        // Return early if already applying layout to prevent recursion
        if (layoutInProgress || applyingLayoutRef.current) {
            return { nodes: inputNodes, edges: inputEdges };
        }

        const nodes = inputNodes.length > 0 ? inputNodes : getNodes();
        const edges = inputEdges.length > 0 ? inputEdges : getEdges();

        if (nodes.length === 0) {
            return { nodes, edges };
        }

        try {
            setLayoutInProgress(true);
            applyingLayoutRef.current = true;

            const result = await calculateLayout(nodes, edges, selectedNodes);

            // Update nodes and edges
            if (updateNodes) {
                updateNodes(result.nodes);
            } else if (reactFlowInstance?.setNodes) {
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
            return { nodes, edges };
        } finally {

            setLayoutInProgress(false);
            applyingLayoutRef.current = false;

        }
    }, [
        layoutInProgress,
        getNodes,
        getEdges,
        selectedNodes,
        sourcePosition,
        targetPosition,
        calculateLayout,
        direction,
        updateNodes,
        updateEdges,

        reactFlowInstance,
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
    }, [childrenInitialized, autoLayout, direction, numberOfNodes, nodeSpacing, layerSpacing, parentChildStructure]);

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
            setParentChildStructureChanged(newStructure)
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