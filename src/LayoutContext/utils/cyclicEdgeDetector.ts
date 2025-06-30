import { Edge } from "@xyflow/react";

/**
 * @function getCyclicEdges
 * Detects edges that create cycles in the graph. A cyclic edge is one that creates
 * a path from a node back to itself, either directly (self-loop) or indirectly
 * through other nodes.
 * 
 * @param edges - Array of edges to analyze
 * @param nodeIds - Set of node IDs to consider (only edges between these nodes are analyzed)
 * @returns Array of edges that create cycles
 */
export const getCyclicEdges = (edges: Edge[], nodeIds: Set<string>): Edge[] => {
    // Filter edges to only include those within the specified node set
    const relevantEdges = edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    // Build adjacency list for the graph
    const adjacencyList = new Map<string, string[]>();
    const edgeMap = new Map<string, Edge[]>();

    // Initialize adjacency list for all nodes
    nodeIds.forEach(nodeId => {
        adjacencyList.set(nodeId, []);
    });

    // Populate adjacency list and create edge lookup (supporting multiple edges between same nodes)
    relevantEdges.forEach(edge => {
        const sourceTargets = adjacencyList.get(edge.source) || [];
        sourceTargets.push(edge.target);
        adjacencyList.set(edge.source, sourceTargets);
        
        // Create a unique key for the edge and store all edges with this key
        const edgeKey = `${edge.source}->${edge.target}`;
        const existingEdges = edgeMap.get(edgeKey) || [];
        existingEdges.push(edge);
        edgeMap.set(edgeKey, existingEdges);
    });

    const cyclicEdges: Edge[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    /**
     * DFS function to detect cycles
     * @param node - Current node being visited
     * @param path - Current path from root to this node
     */
    const dfs = (node: string, path: string[]): void => {
        visited.add(node);
        recursionStack.add(node);
        path.push(node);

        const neighbors = adjacencyList.get(node) || [];
        
        for (const neighbor of neighbors) {
            const edgeKey = `${node}->${neighbor}`;
            const edges = edgeMap.get(edgeKey) || [];
            
            if (edges.length === 0) continue;

            // Check for self-loop - add all self-loop edges as cyclic
            if (node === neighbor) {
                cyclicEdges.push(...edges);
                continue;
            }

            // If neighbor is in the current recursion stack, we found a cycle
            if (recursionStack.has(neighbor)) {
                cyclicEdges.push(...edges);
            } else if (!visited.has(neighbor)) {
                // Continue DFS if not visited
                dfs(neighbor, [...path]);
            }
        }

        recursionStack.delete(node);
    };

    // Run DFS from each unvisited node
    nodeIds.forEach(nodeId => {
        if (!visited.has(nodeId)) {
            dfs(nodeId, []);
        }
    });

    // Remove duplicates (in case the same edge is detected multiple times)
    const uniqueCyclicEdges = cyclicEdges.filter((edge, index, self) =>
        index === self.findIndex(e => e.id === edge.id)
    );

    return uniqueCyclicEdges;
};
