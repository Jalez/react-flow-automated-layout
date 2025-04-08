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
 * @param parentIdWithNodes Map of parent IDs to their child nodes
 * @param nodeIdWithNode Map of node IDs to node objects
 * @returns An array of TreeNode objects representing root parent nodes, each containing its hierarchy
 */
export const buildNodeTree = (
  parentIdWithNodes: Map<string, Node[]>,
  nodeIdWithNode: Map<string, Node>
): TreeNode[] => {
  // Track processed nodes to avoid circular references
  const processedNodes = new Set<string>();
  
  // Map to store all tree nodes indexed by their ID
  const treeNodeMap = new Map<string, TreeNode>();
  
  // Create TreeNode objects only for parent nodes
  parentIdWithNodes.forEach((_, id) => {
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
    if (!parentIdWithNodes.has(nodeId)) return null;
    
    const node = nodeIdWithNode.get(nodeId);
    if (!node) return null;
    
    processedNodes.add(nodeId);
    const treeNode = treeNodeMap.get(nodeId)!;
    treeNode.depth = currentDepth;
    
    // Add children that are parents from parentIdWithNodes map
    const childNodes = parentIdWithNodes.get(nodeId) || [];
    for (const childNode of childNodes) {
      if (parentIdWithNodes.has(childNode.id)) {
        const childTreeNode = buildTreeRecursively(childNode.id, currentDepth + 1);
        if (childTreeNode) {
          treeNode.children.push(childTreeNode);
        }
      }
    }
    
    return treeNode;
  };
  
  // Find root parent nodes (parent nodes without parents or with non-existent parents)
  const rootNodes: TreeNode[] = [];
  
  parentIdWithNodes.forEach((_, id) => {
    const node = nodeIdWithNode.get(id);
    if (node) {
      // If node has no parent, or parent doesn't exist in our node map, it's a root
      const parentId = node.parentId;
      if (!parentId) {
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