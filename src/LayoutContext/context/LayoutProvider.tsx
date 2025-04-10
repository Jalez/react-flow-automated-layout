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
    layoutEngines?: Record<string, LayoutEngine>;
    updateNodes?: (nodes: Node[]) => void;
    updateEdges?: (edges: Edge[]) => void;
    parentIdWithNodes: Map<string, Node[]>;
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
    layoutEngines: customEngines,
    updateNodes,
    updateEdges,
    parentIdWithNodes,
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

    // Refs to prevent infinite loops
    const applyingLayoutRef = useRef(false);
    const pendingSpacingUpdateRef = useRef<{ node?: number, layer?: number } | null>(null);


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

    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(({ nodes }: { nodes: Node[]; }) => {
        setSelectedNodes(nodes.map((node: Node) => node.id));
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
        parentIdWithNodes,
        nodeIdWithNode,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight
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

    // Get nodes from ReactFlow
    const getNodes = useCallback((): Node[] => {
        try {
            return reactFlowInstance?.getNodes() || [];
        } catch (error) {
            return [];
        }
    }, [reactFlowInstance]);

    // Get edges from ReactFlow
    const getEdges = useCallback((): Edge[] => {
        try {
            return reactFlowInstance?.getEdges() || [];
        } catch (error) {
            return [];
        }
    }, [reactFlowInstance]);

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
        if (nodeIdWithNode.size > 0 && parentIdWithNodes.size > 0 && !childrenInitialized) {
            setChildrenInitialized(true);
        }
    }, [nodeIdWithNode, parentIdWithNodes, childrenInitialized]);

    // Effect to update handle positions and reapply layout when autoLayout is enabled
    useEffect(() => {
        if (childrenInitialized && autoLayout) {
            // Update handle positions based on new directions
            applyLayout();
        }
    }, [childrenInitialized, autoLayout, direction, numberOfNodes, nodeSpacing, layerSpacing]);

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
        parentResizingOptions,
        layoutEngines,
        layoutEngineOptions,
        parentIdWithNodes,
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