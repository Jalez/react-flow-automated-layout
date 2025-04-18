import { Node } from "@xyflow/react";

/**
 * Filters selected node IDs to only include parent nodes and removes redundant parent selections
 * (parents that would include changes from other selected parents)
 * 
 * @param selectedNodeIds Array of node IDs that were selected
 * @param parentIdWithNodes Map of parent IDs to their child nodes
 * @param nodeIdWithNode Map of node IDs to nodes
 * @returns Array of filtered parent node IDs that should be processed
 */
const filterSelectedParentNodes = (
  selectedNodeIds: string[],
  parentIdWithNodes: Map<string, Node[]>,
  nodeIdWithNode: Map<string, Node>
): string[] => {
  if (selectedNodeIds.length === 0) {
    return [];
  }

  // Step 1: Include parents of selected nodes to ensure they are processed
  const parentIdsOfSelection = selectedNodeIds
    .map(id => nodeIdWithNode.get(id)?.parentId)
    .filter((pid): pid is string => Boolean(pid));
  const effectiveSelectedIds = Array.from(
    new Set([...selectedNodeIds, ...parentIdsOfSelection])
  );

  // Step 2: Keep only IDs that are parent nodes (exist in parentIdWithNodes)
  const parentNodeIds = effectiveSelectedIds.filter(id => parentIdWithNodes.has(id));
  
  // If we have no parent nodes selected, include "no-parent" to process root nodes
  if (parentNodeIds.length === 0) {
    return ["no-parent"];
  }
  
  // Step 3: Filter out parents that are children of other selected parents
  // to avoid redundant processing
  const filteredParentIds = parentNodeIds.filter(parentId => {
    const node = nodeIdWithNode.get(parentId);
    if (!node) return true; // Keep if node not found (shouldn't happen)
    
    // If this node's parent is also in our selection, skip this node
    return !node.parentId || !parentNodeIds.includes(node.parentId);
  });
  
  // Always include "no-parent" to ensure top-level nodes are processed
  if (!filteredParentIds.includes("no-parent")) {
    filteredParentIds.unshift("no-parent");
  }
  
  return filteredParentIds;
};

export default filterSelectedParentNodes;