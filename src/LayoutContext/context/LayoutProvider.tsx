import { ReactNode, useCallback, useEffect } from 'react';
import { Edge, Node, useOnSelectionChange, useNodes, useEdges } from '@xyflow/react';
import LayoutContext, {
    LayoutAlgorithm,
    LayoutContextState,
    LayoutDirection,
    LayoutEngine,
    ParentResizingOptions,
    useLayoutContext
} from './LayoutContext';
import { useLayoutState } from '../hooks/useLayoutState';
import { useNodeMaps } from '../hooks/useNodeMaps';
import { useLayoutOperations } from '../hooks/useLayoutOperations';
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
    nodeParentIdMapWithChildIdSet?: Map<string, Set<string>>;
    nodeIdWithNode?: Map<string, Node>;
    noParentKey?: string;
    disableAutoLayoutEffect?: boolean;
}

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
    noParentKey = 'no-parent',
    disableAutoLayoutEffect = false,
}: LayoutProviderProps) {
    const nodes = useNodes();
    const edges = useEdges();

    // Use the new hooks
    const {
        direction, algorithm, autoLayout, layoutInProgress, layoutHidden,
        layoutEngines, layoutEngineOptions, padding, nodeSpacing, layerSpacing,
        nodeWidth, nodeHeight, parentResizingOptions, selectedNodes,
        setDirection, setAlgorithm, setAutoLayout, setLayoutInProgress,
        setLayoutHidden, setLayoutEngines, setLayoutEngineOptions, setPadding,
        setNodeSpacing, setLayerSpacing, setNodeWidth, setNodeHeight,
        setParentResizingOptionsState, setSelectedNodes
    } = useLayoutState({
        initialDirection,
        initialAlgorithm,
        initialAutoLayout,
        initialPadding,
        initialSpacing,
        initialNodeDimensions,
        initialParentResizingOptions,
        includeHidden,
        layoutEngines: customEngines,
    });

    const {
        nodeIdWithNode,
        nodeParentIdMapWithChildIdSet,
        numberOfNodes,
        nodesLength,
        childrenInitialized,
        parentChildStructure
    } = useNodeMaps({
        nodes,
        externalNodeIdWithNode,
        externalNodeParentIdMapWithChildIdSet,
        noParentKey
    });

    // Selection change handler
    const onChange = useCallback(({ nodes }: { nodes: Node[]; }) => {
        setSelectedNodes(nodes);
    }, [setSelectedNodes]);

    useOnSelectionChange({
        onChange,
    });

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
        noParentKey
    );

    const { applyLayout } = useLayoutOperations({
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
    });

    // Register a new layout engine
    const registerLayoutEngine = useCallback((name: string, engine: LayoutEngine) => {
        setLayoutEngines(prev => ({ ...prev, [name]: engine }));
    }, [setLayoutEngines]);

    // Update parent resizing options
    const setParentResizingOptions = useCallback((options: Partial<ParentResizingOptions>) => {
        setParentResizingOptionsState(prev => ({
            ...prev,
            ...options,
            enabled: autoLayout,
        }));
    }, [autoLayout, setParentResizingOptionsState]);

    // Effect to update handle positions and reapply layout when autoLayout is enabled
    useEffect(() => {
  
        if (disableAutoLayoutEffect) return; // Skip effect if disabled
        if(!nodeIdWithNode.has(nodes[(nodes.length - 1)]?.id)) {
            return; // Skip if there is a discrepancy in nodes: this prevents unnecessary layout recalculations when the nodes in the flow are not in sync with the context
        }
        if (childrenInitialized && autoLayout) {
            applyLayout();
        }
    }, [childrenInitialized, autoLayout, direction, numberOfNodes, nodeSpacing, layerSpacing, parentChildStructure, nodesLength]);
    // Provide the context value
    const contextValue: LayoutContextState = {
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
        noParentKey,
        updateNodes,
        updateEdges,
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
        applyLayout,
        clearLayoutCache: () => { },
        registerLayoutEngine,
    };

    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
        </LayoutContext.Provider>
    );
}

export { useLayoutContext };