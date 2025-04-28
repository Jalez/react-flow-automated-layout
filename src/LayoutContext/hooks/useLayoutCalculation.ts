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
 * @param nodeParentIdMapWithChildIdSet Map of parent IDs to their set of child IDs
 * @param nodeIdWithNode Map of node IDs to nodes
 * @param nodes All nodes in the graph
 * @param edges All edges in the graph
 * @param margin Margin to use for layout
 * @param nodeSpacing Spacing between nodes
 * @param layerSpacing Spacing between layers
 * @param nodeWidth Width of nodes
 * @param nodeHeight Height of nodes
 * @param layoutHidden Whether to include hidden nodes in the layout
 * @returns Object containing updated nodes and edges
 */
const processSelectedNodes = (
  selectedNodes: Node[],
  dagreDirection: string,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  nodeIdWithNode: Map<string, Node>,
  nodes: Node[],
  edges: Edge[],
  margin: number,
  nodeSpacing: number,
  layerSpacing: number,
  nodeWidth: number,
  nodeHeight: number,
  layoutHidden: boolean = false
): { nodes: Node[], edges: Edge[] } => {
  // Filter to only include relevant parent nodes
  const filteredParentIds = filterSelectedParentNodes(
    selectedNodes,
    nodeParentIdMapWithChildIdSet,
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
      nodeParentIdMapWithChildIdSet,
      nodeIdWithNode,
      edges,
      margin,
      nodeSpacing,
      layerSpacing,
      nodeWidth,
      nodeHeight,
      undefined,
      layoutHidden
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
  
  // Convert maps to arrays
  const updatedNodes = nodes.map(node => 
    updatedNodesMap.has(node.id) ? updatedNodesMap.get(node.id)! : node
  );
  
  const updatedEdges = edges.map(edge => 
    updatedEdgesMap.has(edge.id) ? updatedEdgesMap.get(edge.id)! : edge
  );
  
  return { nodes: updatedNodes, edges: updatedEdges };
};

/**
 * Hook for layout calculation functionality
 */
export const useLayoutCalculation = (
  layoutEngines: Record<string, LayoutEngine>,
  direction: LayoutDirection,
  algorithm: string,
  parentResizingOptions: any,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  nodeIdWithNode: Map<string, Node>,
  nodeSpacing: number,
  layerSpacing: number,
  nodeWidth: number = 172,
  nodeHeight: number = 36,
  layoutHidden: boolean = false
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
    
    // Filter out hidden nodes if layoutHidden is false
    const filteredNodes = layoutHidden 
      ? nodes 
      : nodes.filter(node => !node.hidden);
    
    // Filter edges to only include connections between visible nodes
    const visibleNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredEdges = layoutHidden
      ? edges
      : edges.filter(edge => 
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );
        
    // Convert direction to format RecursiveLayoutContainerOrganizer expects
    const dagreDirection = convertDirection(direction);
    
    // The margin to use for layout
    const margin = parentResizingOptions.padding.horizontal;
    
    let updatedNodes: Node[] = [];
    let updatedEdges: Edge[] = [];
    
    // Process based on whether we have selected nodes or not
    if (selectedNodes && selectedNodes.length > 0) {
      // Also filter selected nodes if needed
      const filteredSelectedNodes = layoutHidden
        ? selectedNodes
        : selectedNodes.filter(node => !node.hidden);
      
      const result = processSelectedNodes(
        filteredSelectedNodes,
        dagreDirection,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        filteredNodes,
        filteredEdges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        layoutHidden
      );
      
      updatedNodes = result.nodes;
      updatedEdges = result.edges;
    } else {
      // Use our helper function to process the entire tree in depth order
      const nodeTree = buildNodeTree(nodeParentIdMapWithChildIdSet, nodeIdWithNode);
      const result = organizeLayoutByTreeDepth(
        nodeTree,
        dagreDirection,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        filteredEdges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        undefined,
        layoutHidden
      );

      updatedNodes = result.updatedNodes;
      updatedEdges = result.updatedEdges;
    }

    // Merge the updated nodes with the original nodes that were filtered out (hidden nodes)
    const finalNodes = nodes.map(node => {
      if (!layoutHidden && node.hidden) {
        return node; // Keep hidden nodes as they are
      }
      const updatedNode = updatedNodes.find(n => n.id === node.id);
      return updatedNode || node;
    });

    return {
      nodes: finalNodes,
      edges: updatedEdges
    };
  }, [
    algorithm, 
    direction, 
    layoutEngines,
    parentResizingOptions.padding.horizontal,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
    nodeSpacing,
    layerSpacing,
    nodeWidth,
    nodeHeight,
    layoutHidden
  ]);

  return { calculateLayout };
};