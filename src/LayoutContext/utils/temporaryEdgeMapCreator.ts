import { Edge, Node } from "@xyflow/react";
import { findLCAWithChildren } from "./treeUtils";

/**
 * Process all edges once to create a global temporary edges map
 * This replaces all edge processing complexity
 */
export function createGlobalTemporaryEdgesMap(
  edges: Edge[],
  nodeIdWithNode: Map<string, Node>,
  noParentKey: string = 'no-parent'
): Map<string, Edge[]> {
  const temporaryEdgesByParent = new Map<string, Edge[]>();
  
  for (const edge of edges) {
    // For every edge, calculate LCA and create temporary edge
    const { lca, sourceChild, targetChild } = findLCAWithChildren(
      edge.source, 
      edge.target, 
      nodeIdWithNode, 
      noParentKey
    );
    
    if (lca && sourceChild && targetChild && sourceChild !== targetChild) {
      // Only create temporary edge if source and target are different
      // (avoids self-loops in temporary edges)
      
      const tempEdge = JSON.parse(JSON.stringify(edge));
      tempEdge.source = sourceChild;
      tempEdge.target = targetChild;
      tempEdge.id = `temp_${tempEdge.id}_${lca}`;
      tempEdge.data = { 
        ...tempEdge.data, 
        isTemporary: true, 
        originalSource: edge.source, 
        originalTarget: edge.target 
      };
      
      // Store under the LCA for processing when that level is reached
      if (!temporaryEdgesByParent.has(lca)) {
        temporaryEdgesByParent.set(lca, []);
      }
      temporaryEdgesByParent.get(lca)!.push(tempEdge);
    }
  }
  
  return temporaryEdgesByParent;
}