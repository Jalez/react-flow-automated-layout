import { Edge, Node } from "@xyflow/react";
import { findLCAWithChildren, getFirstChildUnderAncestor } from "./treeUtils";

type TemporaryEdge = Edge & {
  data?: Record<string, unknown>;
};

const cloneEdge = (edge: Edge): TemporaryEdge =>
  JSON.parse(JSON.stringify(edge));

const createTemporaryEdge = (
  edge: Edge,
  source: string,
  target: string,
  id: string,
  data: Record<string, unknown>
): TemporaryEdge => {
  const tempEdge = cloneEdge(edge);
  tempEdge.source = source;
  tempEdge.target = target;
  tempEdge.id = id;
  tempEdge.data = {
    ...tempEdge.data,
    ...data,
  };

  return tempEdge;
};

const markReciprocalContainerEdges = (temporaryEdgesByParent: Map<string, Edge[]>) => {
  for (const edges of temporaryEdgesByParent.values()) {
    const edgeByPair = new Map<string, TemporaryEdge[]>();

    edges.forEach(edge => {
      const key = `${edge.source}->${edge.target}`;
      const siblings = edgeByPair.get(key) || [];
      siblings.push(edge as TemporaryEdge);
      edgeByPair.set(key, siblings);
    });

    const markedPairs = new Set<string>();

    edges.forEach(edge => {
      const forwardKey = `${edge.source}->${edge.target}`;
      const reverseKey = `${edge.target}->${edge.source}`;

      if (markedPairs.has(forwardKey) || markedPairs.has(reverseKey)) {
        return;
      }

      const reverseEdges = edgeByPair.get(reverseKey);
      if (!reverseEdges || reverseEdges.length === 0) {
        return;
      }

      const forwardEdges = edgeByPair.get(forwardKey) || [];
      [...forwardEdges, ...reverseEdges].forEach(tempEdge => {
        tempEdge.data = {
          ...tempEdge.data,
          isReciprocal: true,
        };
      });

      markedPairs.add(forwardKey);
      markedPairs.add(reverseKey);
    });
  }
};

const addSyntheticBridgeEdges = (
  edges: Edge[],
  nodeIdWithNode: Map<string, Node>,
  temporaryEdgesByParent: Map<string, Edge[]>,
  noParentKey: string
) => {
  const incomingByPivot = new Map<string, Edge[]>();
  const outgoingByPivot = new Map<string, Edge[]>();

  edges.forEach(edge => {
    const incoming = incomingByPivot.get(edge.target) || [];
    incoming.push(edge);
    incomingByPivot.set(edge.target, incoming);

    const outgoing = outgoingByPivot.get(edge.source) || [];
    outgoing.push(edge);
    outgoingByPivot.set(edge.source, outgoing);
  });

  const syntheticIds = new Set<string>();

  outgoingByPivot.forEach((outgoingEdges, pivotNodeId) => {
    const incomingEdges = incomingByPivot.get(pivotNodeId) || [];
    if (incomingEdges.length === 0) {
      return;
    }

    incomingEdges.forEach(incomingEdge => {
      outgoingEdges.forEach(outgoingEdge => {
        if (incomingEdge.source === outgoingEdge.target) {
          return;
        }

        const { lca, sourceChild, targetChild } = findLCAWithChildren(
          incomingEdge.source,
          outgoingEdge.target,
          nodeIdWithNode,
          noParentKey
        );

        const incomingLca = findLCAWithChildren(
          incomingEdge.source,
          pivotNodeId,
          nodeIdWithNode,
          noParentKey
        ).lca;
        const outgoingLca = findLCAWithChildren(
          pivotNodeId,
          outgoingEdge.target,
          nodeIdWithNode,
          noParentKey
        ).lca;

        if (!incomingLca || incomingLca !== outgoingLca) {
          return;
        }

        const anchorBranchId = getFirstChildUnderAncestor(
          incomingEdge.source,
          incomingLca,
          nodeIdWithNode,
          noParentKey
        );
        const targetBranchId = getFirstChildUnderAncestor(
          outgoingEdge.target,
          incomingLca,
          nodeIdWithNode,
          noParentKey
        );
        const pivotBranchId = getFirstChildUnderAncestor(
          pivotNodeId,
          incomingLca,
          nodeIdWithNode,
          noParentKey
        );

        if (!anchorBranchId || !targetBranchId || !pivotBranchId) {
          return;
        }

        if (anchorBranchId !== targetBranchId || anchorBranchId === pivotBranchId) {
          return;
        }

        const syntheticParentId = anchorBranchId;
        const syntheticSource = getFirstChildUnderAncestor(
          incomingEdge.source,
          syntheticParentId,
          nodeIdWithNode,
          noParentKey
        );
        const syntheticTarget = getFirstChildUnderAncestor(
          outgoingEdge.target,
          syntheticParentId,
          nodeIdWithNode,
          noParentKey
        );

        if (!lca || !sourceChild || !targetChild || !syntheticSource || !syntheticTarget || syntheticSource === syntheticTarget) {
          return;
        }

        const syntheticId = `synthetic_bridge_${incomingEdge.id}_${pivotNodeId}_${outgoingEdge.id}_${syntheticParentId}`;
        if (syntheticIds.has(syntheticId)) {
          return;
        }

        const syntheticEdge = createTemporaryEdge(
          incomingEdge,
          syntheticSource,
          syntheticTarget,
          syntheticId,
          {
            isTemporary: true,
            isSyntheticBridge: true,
            bridgeNode: pivotNodeId,
            bridgeBranch: pivotBranchId,
            anchorBranch: anchorBranchId,
            originalSource: incomingEdge.source,
            originalTarget: outgoingEdge.target,
          }
        );

        if (!temporaryEdgesByParent.has(syntheticParentId)) {
          temporaryEdgesByParent.set(syntheticParentId, []);
        }
        temporaryEdgesByParent.get(syntheticParentId)!.push(syntheticEdge);
        syntheticIds.add(syntheticId);
      });
    });
  });
};

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
      const tempEdge = createTemporaryEdge(
        edge,
        sourceChild,
        targetChild,
        `temp_${edge.id}_${lca}`,
        {
          isTemporary: true,
          originalSource: edge.source,
          originalTarget: edge.target,
        }
      );
      
      // Store under the LCA for processing when that level is reached
      if (!temporaryEdgesByParent.has(lca)) {
        temporaryEdgesByParent.set(lca, []);
      }
      temporaryEdgesByParent.get(lca)!.push(tempEdge);
    }
  }

  addSyntheticBridgeEdges(edges, nodeIdWithNode, temporaryEdgesByParent, noParentKey);
  markReciprocalContainerEdges(temporaryEdgesByParent);
  
  return temporaryEdgesByParent;
}
