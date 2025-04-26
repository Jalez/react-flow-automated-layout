import { Node } from "@xyflow/react";

/**
 * Filters selected node IDs to only include parent nodes and removes redundant parent selections
 * (parents that would include changes from other selected parents)
 * 
 * @param selectedNodeIds Array of node IDs that were selected
 * @param nodeParentIdMapWithChildIdSet Map of parent IDs to their set of child IDs
 * @param nodeIdWithNode Map of node IDs to nodes
 * @returns Array of filtered parent node IDs that should be processed
 */
const filterSelectedParentNodes = (
  selectedNodes: Node[],
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  nodeIdWithNode: Map<string, Node>
): string[] => {
  // Step 1: Include parents of selected nodes to ensure they are processed
  const selectedNodeIds = selectedNodes.map(node => node.id);
  const parentIdsOfSelection = selectedNodes
    .map(node => nodeIdWithNode.get(node.id)?.parentId || node.parentId)
    .filter((pid): pid is string => Boolean(pid));
  const effectiveSelectedIds = Array.from(
    new Set([...selectedNodeIds, ...parentIdsOfSelection])
  );
  // Step 2: Keep only IDs that are parent nodes (exist in nodeParentIdMapWithChildIdSet)
  const parentNodeIds = effectiveSelectedIds.filter(id => nodeParentIdMapWithChildIdSet.has(id));
  
  // Step 3: Filter out parents that are children of other selected parents
  // to avoid redundant processing
  const filteredParentIds = parentNodeIds.filter(parentId => {
    const node = nodeIdWithNode.get(parentId);
    if (!node) return true; // Keep if node not found (shouldn't happen)
    
    // If this node's parent is also in our selection, skip this node
    return !node.parentId || !parentNodeIds.includes(node.parentId);
  });
  
  
  if (filteredParentIds.length === 0) {
    return ["no-parent"];
  }
  
  return filteredParentIds;
};

export default filterSelectedParentNodes;