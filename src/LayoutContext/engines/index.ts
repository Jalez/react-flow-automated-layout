import { LayoutEngine } from '../context/LayoutContext';
import { calculateLayoutWithDagre } from '../core/LayoutElementsWithDagre';
import type { LayoutConfig } from '../hooks/useLayoutCalculation';

/**
 * Adapter for the existing Dagre implementation.
 * This wraps the original calculateLayoutWithDagre function to match the LayoutEngine interface
 */
export const DagreEngine: LayoutEngine = {
  calculate: async (_nodes, _edges, options: LayoutConfig | Record<string, any>) => {
    // Accept either a LayoutConfig or a plain options object for backward compatibility
    const nodes = (options as LayoutConfig).nodes || _nodes;
    const edges = (options as LayoutConfig).edges || _edges;
    // Use direction from LayoutConfig, or fallback to options.direction if present, or default to 'TB'
    const direction = (options as LayoutConfig).dagreDirection
      || (typeof (options as any).direction === 'string' && ((options as any).direction === 'RIGHT' || (options as any).direction === 'LEFT' ? 'LR' : 'TB'))
      || 'TB';
    const dagreDirection = direction as import('../core/HierarchicalLayoutOrganizer').Direction;
    // Use margin from LayoutConfig, or fallback to options.padding if present, or default to 0
    const margin = (options as LayoutConfig).margin ?? (typeof (options as any).padding === 'number' ? (options as any).padding : 0);
    const nodeSpacing = (options as LayoutConfig).nodeSpacing ?? 50;
    const layerSpacing = (options as LayoutConfig).layerSpacing ?? 50;
    const nodeWidth = (options as LayoutConfig).nodeWidth ?? 172;
    const nodeHeight = (options as LayoutConfig).nodeHeight ?? 36;
    const includeHidden = (options as LayoutConfig).layoutHidden ?? false;
    // Call the existing Dagre implementation
    return calculateLayoutWithDagre(
      nodes,
      edges,
      dagreDirection,
      margin,
      nodeSpacing,
      layerSpacing,
      nodeWidth,
      nodeHeight,
      includeHidden
    );
  }
};

// Export available engines
export const engines = {
  dagre: DagreEngine,
};