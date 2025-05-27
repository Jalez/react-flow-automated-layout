import { useState } from 'react';
import { Node } from '@xyflow/react';
import { LayoutAlgorithm, LayoutDirection, LayoutEngine, ParentResizingOptions } from '../context/LayoutContext';
import { DEFAULT_PARENT_RESIZING_OPTIONS } from '../utils/layoutProviderUtils';
import { engines } from '../engines';

interface UseLayoutStateProps {
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
}

export function useLayoutState({
    initialDirection = 'DOWN',
    initialAlgorithm = 'layered',
    initialAutoLayout = true,
    initialPadding = 50,
    initialSpacing = { node: 50, layer: 50 },
    initialNodeDimensions = { width: 172, height: 36 },
    initialParentResizingOptions,
    includeHidden = false,
    layoutEngines: customEngines,
}: UseLayoutStateProps) {
    // Layout configuration state
    const [direction, setDirection] = useState<LayoutDirection>(initialDirection);
    const [algorithm, setAlgorithm] = useState<LayoutAlgorithm>(initialAlgorithm);
    const [autoLayout, setAutoLayout] = useState<boolean>(initialAutoLayout);
    const [layoutInProgress, setLayoutInProgress] = useState<boolean>(false);
    const [layoutHidden, setLayoutHidden] = useState<boolean>(includeHidden);
    const [layoutEngines, setLayoutEngines] = useState<Record<string, LayoutEngine>>({
        ...engines,
        ...customEngines,
    });
    const [layoutEngineOptions, setLayoutEngineOptions] = useState<Record<string, any>>({});

    // Spacing and dimensions state
    const [padding, setPadding] = useState<number>(initialPadding);
    const [nodeSpacing, setNodeSpacing] = useState<number>(initialSpacing.node || 150);
    const [layerSpacing, setLayerSpacing] = useState<number>(initialSpacing.layer || 180);
    const [nodeWidth, setNodeWidth] = useState<number>(initialNodeDimensions.width || 100);
    const [nodeHeight, setNodeHeight] = useState<number>(initialNodeDimensions.height || 100);
    
    // Parent resizing options state
    const [parentResizingOptions, setParentResizingOptionsState] = useState<ParentResizingOptions>({
        ...DEFAULT_PARENT_RESIZING_OPTIONS,
        ...initialParentResizingOptions,
        enabled: initialAutoLayout,
    });

    // Selected nodes state
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

    return {
        // State
        direction,
        algorithm,
        autoLayout,
        layoutInProgress,
        layoutHidden,
        layoutEngines,
        layoutEngineOptions,
        padding,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        parentResizingOptions,
        selectedNodes,

        // Setters
        setDirection,
        setAlgorithm,
        setAutoLayout,
        setLayoutInProgress,
        setLayoutHidden,
        setLayoutEngines,
        setLayoutEngineOptions,
        setPadding,
        setNodeSpacing,
        setLayerSpacing,
        setNodeWidth,
        setNodeHeight,
        setParentResizingOptionsState,
        setSelectedNodes,
    };
}