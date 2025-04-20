import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { LayoutDirection, LayoutEngine } from '../context/LayoutContext';
import { convertDirection } from '../utils/layoutProviderUtils';
import { organizeLayoutRecursively, organizeLayoutByTreeDepth } from '../core/HierarchicalLayoutOrganizer';
import { buildNodeTree } from '../utils/treeUtils';
import filterSelectedParentNodes from '../utils/filterSelectedParentNodes';



/**
 * Process selected node IDs for layout calculations
 * 
 * @param selectedNodeIds IDs of selected nodes to process for layout
 * @param dagreDirection Direction for layout algorithm
 * @param parentIdWithNodes Map of parent IDs to their child nodes
 * @param nodeIdWithNode Map of node IDs to nodes
 * @param nodes All nodes in the graph
 * @param edges All edges in the graph
 * @param margin Margin to use for layout
 * @param nodeSpacing Spacing between nodes
 * @param layerSpacing Spacing between layers
 * @param nodeWidth Width of nodes
 * @param nodeHeight Height of nodes
 * @returns Object containing updated nodes and edges
 */
const processSelectedNodes = (
  selectedNodes: Node[],
  dagreDirection: string,
  parentIdWithNodes: Map<string, Node[]>,
  nodeIdWithNode: Map<string, Node>,
  nodes: Node[],
  edges: Edge[],
  margin: number,
  nodeSpacing: number,
  layerSpacing: number,
  nodeWidth: number,
  nodeHeight: number
): { nodes: Node[], edges: Edge[] } => {
  // Filter to only include relevant parent nodes
  const filteredParentIds = filterSelectedParentNodes(
    selectedNodes,
    parentIdWithNodes,
    nodeIdWithNode
  );
  
  if (filteredParentIds.length === 0) {
    return { nodes, edges };
  }
  
  // Map to track updated nodes and edges (using node/edge ID as key for faster lookups)
  const updatedNodesMap = new Map<string, Node>();
  const updatedEdgesMap = new Map<string, Edge>();
  
  // Process each parent node
  for (const parentId of filteredParentIds) {
    const { updatedNodes, updatedEdges } = organizeLayoutRecursively(
      parentId,
      dagreDirection as any,
      parentIdWithNodes,
      nodeIdWithNode,
      edges,
      margin,
      nodeSpacing,
      layerSpacing,
      nodeWidth,
      nodeHeight
    );
    
    // Add updated nodes to map (this automatically handles duplicates)
    updatedNodes.forEach(node => {
      updatedNodesMap.set(node.id, node);
    });
    
    // Add updated edges to map
    updatedEdges.forEach(edge => {
      updatedEdgesMap.set(edge.id, edge);
    });
  }
  
  // Performance improvement: Use Maps for faster merging of updated and non-updated elements
  // Create final nodes array by merging original nodes with updates
  const finalNodes = nodes.map(node => 
    updatedNodesMap.has(node.id) ? updatedNodesMap.get(node.id)! : node
  );
  
  // Create final edges array by merging original edges with updates
  const finalEdges = edges.map(edge => 
    updatedEdgesMap.has(edge.id) ? updatedEdgesMap.get(edge.id)! : edge
  );
  
  return { nodes: finalNodes, edges: finalEdges };
};

/**
 * Hook for layout calculation functionality
 */
export const useLayoutCalculation = (
  layoutEngines: Record<string, LayoutEngine>,
  direction: LayoutDirection,
  algorithm: string,
  parentResizingOptions: any,
  parentIdWithNodes: Map<string, Node[]>,
  nodeIdWithNode: Map<string, Node>,
  nodeSpacing: number,
  layerSpacing: number,
  nodeWidth: number = 172,
  nodeHeight: number = 36
) => {
  
  /**
   * Apply layout to nodes and edges
   */
  const calculateLayout = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    selectedNodes?: Node[]
  ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    // Get the appropriate layout engine from engines
    const engine = layoutEngines[algorithm] || layoutEngines.dagre;
    if (!engine) {
      console.error(`Layout engine "${algorithm}" not found`);
      return { nodes, edges };
    }
        
    // Convert direction to format RecursiveLayoutContainerOrganizer expects
    const dagreDirection = convertDirection(direction);
    
    // The margin to use for layout
    const margin = parentResizingOptions.padding.horizontal;
    
    // If we have selected specific nodes, process only those
    if (selectedNodes && selectedNodes.length > 0) {
      return processSelectedNodes(
        selectedNodes,
        dagreDirection,
        parentIdWithNodes,
        nodeIdWithNode,
        nodes,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight
      );
    } else {
      // Use our helper function to process the entire tree in depth order
      const nodeTree = buildNodeTree(parentIdWithNodes, nodeIdWithNode);
      const {updatedNodes, updatedEdges} =  organizeLayoutByTreeDepth(
        nodeTree,
        dagreDirection,
        parentIdWithNodes,
        nodeIdWithNode,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight
      );

      return {
        nodes: updatedNodes,
        edges: updatedEdges
      };
    }
  }, [
    algorithm, 
    direction, 
    layoutEngines,
    parentResizingOptions.padding.horizontal,
    parentIdWithNodes,
    nodeIdWithNode,
    nodeSpacing,
    layerSpacing,
    nodeWidth,
    nodeHeight
  ]);

  return { calculateLayout };
};