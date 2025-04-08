import { Edge, Node } from '@xyflow/react';
import { LayoutEngine } from '../context/LayoutContext';
import { calculateLayoutWithDagre } from '../core/LayoutElementsWithDagre';

/**
 * Adapter for the existing Dagre implementation.
 * This wraps the original calculateLayoutWithDagre function to match the LayoutEngine interface
 */
export const DagreEngine: LayoutEngine = {
  calculate: async (nodes: Node[], edges: Edge[], options: Record<string, any>) => {
    // Convert direction format from our API (UP/DOWN/LEFT/RIGHT) to Dagre format (TB/LR)
    const direction = options.direction === "RIGHT" || options.direction === "LEFT" ? "LR" : "TB";
    
    // Use margin from options or default to 0
    const margin = options.padding || 0;
    
    // Call the existing Dagre implementation
    return calculateLayoutWithDagre(nodes, edges, direction, margin);
  }
};

// Export available engines
export const engines = {
  dagre: DagreEngine,
};