import { createContext, useContext } from 'react';
import { Edge, Node } from '@xyflow/react';

// Layout types we support
export type LayoutDirection = "DOWN" | "RIGHT" | "LEFT" | "UP";
export type LayoutAlgorithm = "layered" | "mrtree";

// Define the layout engine interface
export interface LayoutEngine {
  calculate: (
    nodes: Node[], 
    edges: Edge[], 
    options: Record<string, any>
  ) => Promise<{nodes: Node[], edges: Edge[], width?: number, height?: number}>;
}

// Parent resizing options
export interface ParentResizingOptions {
  enabled: boolean;
  padding: {
    horizontal: number;
    vertical: number;
  };
  respectHeaderHeight: boolean;
  minWidth?: number;
  minHeight?: number;
}

// Define the context state
export interface LayoutContextState {
  // Layout settings
  direction: LayoutDirection;
  algorithm: LayoutAlgorithm;
  autoLayout: boolean;
  layoutInProgress: boolean;
  padding: number;
  nodeSpacing: number;
  layerSpacing: number;
  nodeWidth: number;
  nodeHeight: number;
  layoutHidden: boolean;
  
  // Parent resizing options
  parentResizingOptions: ParentResizingOptions;
  
  // Layout engine options and registry
  layoutEngines: Record<string, LayoutEngine>;
  layoutEngineOptions: Record<string, any>;
  
  // Node relationship maps
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>;
  nodeIdWithNode: Map<string, Node>;
  
  // Optional callbacks for updating nodes/edges
  updateNodes?: (nodes: Node[]) => void;
  updateEdges?: (edges: Edge[]) => void;
  
  // Actions
  setDirection: (direction: LayoutDirection) => void;
  setAlgorithm: (algorithm: LayoutAlgorithm) => void;
  setAutoLayout: (auto: boolean) => void;
  setLayoutInProgress: (inProgress: boolean) => void;
  setPadding: (padding: number) => void;
  setNodeSpacing: (spacing: number) => void;
  setLayerSpacing: (spacing: number) => void;
  setNodeWidth: (width: number) => void;
  setNodeHeight: (height: number) => void;
  setLayoutHidden: (hidden: boolean) => void;
  setParentResizingOptions: (options: Partial<ParentResizingOptions>) => void;
  setLayoutEngineOptions: (options: Record<string, any>) => void;
  
  // Layout application
  applyLayout: (nodes?: Node[], edges?: Edge[]) => Promise<{nodes: Node[], edges: Edge[]}>;
  clearLayoutCache: () => void;
  
  // Layout engine registration
  registerLayoutEngine: (name: string, engine: LayoutEngine) => void;
}

// Create the context with a default undefined value
const LayoutContext = createContext<LayoutContextState | undefined>(undefined);

// Custom hook to use the layout context
export function useLayoutContext(): LayoutContextState {
  const context = useContext(LayoutContext);
  
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  
  return context;
}

export default LayoutContext;