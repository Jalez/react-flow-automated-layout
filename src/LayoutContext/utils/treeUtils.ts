import { Node } from '@xyflow/react';

/**
 * Tree node representing a node in the parent-child hierarchy
 */
export interface TreeNode {
  id: string;
  node: Node;
  children: TreeNode[];
  depth: number;
}

/**
 * Builds a tree structure from parent-child relationships in the node maps.
 * The tree only includes parent nodes (nodes that have children).
 * The tree starts with root parent nodes (parent nodes without parents) at depth 0.
 * 
 * @param nodeParentIdMapWithChildIdSet Map of parent IDs to their set of child IDs
 * @param nodeIdWithNode Map of node IDs to node objects
 * @param noParentKey Key used to represent nodes without a parent
 * @returns An array of TreeNode objects representing root parent nodes, each containing its hierarchy
 */
export const buildNodeTree = (
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  nodeIdWithNode: Map<string, Node>,
  noParentKey: string = 'no-parent'
): TreeNode[] => {
  // Track processed nodes to avoid circular references
  const processedNodes = new Set<string>();
  
  // Map to store all tree nodes indexed by their ID
  const treeNodeMap = new Map<string, TreeNode>();
  
  // Create TreeNode objects only for parent nodes
  nodeParentIdMapWithChildIdSet.forEach((_, id) => {
    const node = nodeIdWithNode.get(id);
    if (node) {
      treeNodeMap.set(id, {
        id,
        node,
        children: [],
        depth: 0
      });
    }
  });
  
  // Function to build tree recursively starting from a given node
  const buildTreeRecursively = (nodeId: string, currentDepth: number): TreeNode | null => {
    // Skip if already processed (prevents infinite loops with circular references)
    if (processedNodes.has(nodeId)) return null;
    
    // Skip if this node is not a parent
    if (!nodeParentIdMapWithChildIdSet.has(nodeId)) return null;
    
    const node = nodeIdWithNode.get(nodeId);
    if (!node) return null;
    
    processedNodes.add(nodeId);
    const treeNode = treeNodeMap.get(nodeId)!;
    treeNode.depth = currentDepth;
    
    // Add children that are parents from nodeParentIdMapWithChildIdSet map
    const childIds = nodeParentIdMapWithChildIdSet.get(nodeId) || new Set<string>();
    for (const childId of childIds) {
      if (nodeParentIdMapWithChildIdSet.has(childId)) {
        const childNode = nodeIdWithNode.get(childId);
        if (childNode) {
          const childTreeNode = buildTreeRecursively(childId, currentDepth + 1);
          if (childTreeNode) {
            treeNode.children.push(childTreeNode);
          }
        }
      }
    }
    
    return treeNode;
  };
  
  // Find root parent nodes (parent nodes without parents or with non-existent parents)
  const rootNodes: TreeNode[] = [];
  
  nodeParentIdMapWithChildIdSet.forEach((_, id) => {
    const node = nodeIdWithNode.get(id);
    if (node) {
      // If node has no parent, or parent doesn't exist in our node map, it's a root
      const parentId = node.parentId;
      if (!parentId || parentId === noParentKey) {
        const rootTreeNode = buildTreeRecursively(id, 0);
        if (rootTreeNode) {
          rootNodes.push(rootTreeNode);
        }
      }
    }
  });
  
  return rootNodes;
};

/**
 * Gets all nodes at the specified depth in the tree
 * 
 * @param tree The tree structure to search
 * @param targetDepth The depth to find nodes at
 * @returns Array of nodes at the specified depth
 */
export const getNodesAtDepth = (
  tree: TreeNode[],
  targetDepth: number
): Node[] => {
  const result: Node[] = [];
  
  const traverse = (nodes: TreeNode[], currentDepth: number) => {
    for (const treeNode of nodes) {
      if (currentDepth === targetDepth) {
        result.push(treeNode.node);
      }
      
      if (currentDepth < targetDepth) {
        traverse(treeNode.children, currentDepth + 1);
      }
    }
  };
  
  traverse(tree, 0);
  return result;
};

/**
 * Finds the maximum depth in the tree
 * 
 * @param tree The tree structure to analyze
 * @returns The maximum depth in the tree
 */
export const getMaxTreeDepth = (tree: TreeNode[]): number => {
  let maxDepth = 0;
  
  const findMaxDepth = (nodes: TreeNode[], currentDepth: number) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    
    for (const treeNode of nodes) {
      findMaxDepth(treeNode.children, currentDepth + 1);
    }
  };
  
  findMaxDepth(tree, 0);
  return maxDepth;
};


/**
 * Get the path from a node to the root (including the node itself)
 */
export function getAncestorPath(
  nodeId: string,
  nodeIdWithNode: Map<string, Node>,
  noParentKey: string = 'no-parent'
): string[] {
  const path: string[] = [];
  let current = nodeId;
  const visited = new Set<string>();
  
  while (current && current !== noParentKey) {
    if (visited.has(current)) {
      // Cycle detected - break to prevent infinite loop
      console.warn(`Cycle detected in ancestor path for node ${nodeId}`);
      break;
    }
    visited.add(current);
    path.push(current);
    
    const node = nodeIdWithNode.get(current);
    if (!node || !node.parentId) {
      // Node has no parent, so its parent is the noParentKey
      current = noParentKey;
      break;
    }
    current = node.parentId;
  }
  
  // Add root if we reached it
  if (current === noParentKey) {
    path.push(noParentKey);
  }
  
  return path;
}


/**
 * Enhanced LCA function that returns both the LCA and the immediate children
 */
export function findLCAWithChildren(
  sourceNodeId: string,
  targetNodeId: string,
  nodeIdWithNode: Map<string, Node>,
  noParentKey: string = 'no-parent'
): { lca: string | null, sourceChild: string | null, targetChild: string | null } {
  // Get all ancestors for both nodes (including themselves)
  const sourceAncestors = getAncestorPath(sourceNodeId, nodeIdWithNode, noParentKey);
  const targetAncestors = getAncestorPath(targetNodeId, nodeIdWithNode, noParentKey);
  
  // Convert target ancestors to Set for O(1) lookup
  const targetAncestorSet = new Set(targetAncestors);
  
  // Find the first common ancestor from source's perspective
  let lca: string | null = null;
  let sourceChildIndex = -1;
  
  for (let i = 0; i < sourceAncestors.length; i++) {
    if (targetAncestorSet.has(sourceAncestors[i])) {
      lca = sourceAncestors[i];
      sourceChildIndex = i;
      break;
    }
  }
  
  if (!lca) {
    return { lca: null, sourceChild: null, targetChild: null };
  }
  
  // Find the index of LCA in target ancestors
  const targetChildIndex = targetAncestors.indexOf(lca);
  
  // Extract children: the node before the LCA in the path (or the node itself if it's a direct child)
  const sourceChild = sourceChildIndex > 0 ? sourceAncestors[sourceChildIndex - 1] : sourceNodeId;
  const targetChild = targetChildIndex > 0 ? targetAncestors[targetChildIndex - 1] : targetNodeId;
  
  return { lca, sourceChild, targetChild };
}
