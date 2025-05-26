import { Edge, Node } from "@xyflow/react";
import { calculateLayoutWithDagre } from "./Dagre";
import { TreeNode } from "../utils/treeUtils";
import { createGlobalTemporaryEdgesMap } from "../utils/temporaryEdgeMapCreator";

export type Direction = 'TB' | 'LR' | 'RL' | 'BT';



const MARGIN = 10;

/**
 * @function organizeLayoutRecursively
 * Recursively organizes the layout of a container and its parent hierarchy.
 * Starts with the specified node and works upward through the parent chain.
 * 
 * @param parentNodeId - The parent node to start layout from
 * @param direction - The direction of the layout
 * @param nodeParentIdMapWithChildIdSet - A map of parent node ids to their set of child IDs
 * @param nodeIdWithNode - A map of node ids to their nodes
 * @param edges - The edges to layout
 * @param margin - The margin to use for the layout
 * @param nodeSpacing - Spacing between nodes (horizontal within same rank)
 * @param layerSpacing - Spacing between layers (vertical between ranks)
 * @param defaultNodeWidth - Default width for nodes without explicit width
 * @param defaultNodeHeight - Default height for nodes without explicit height
 * @param includeHidden - Whether to include hidden nodes in the layout
 * @param noParentKey - Key used to represent nodes without a parent
 * @returns Promise<{ updatedNodes: Node[], updatedEdges: Edge[] }>
 */
export const organizeLayoutRecursively = async (
    parentNodeId: string,
    direction: Direction,
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
    nodeIdWithNode: Map<string, Node>,
    edges: Edge[],
    margin: number = MARGIN,
    nodeSpacing: number = 50,
    layerSpacing: number = 50,
    defaultNodeWidth: number = 172,
    defaultNodeHeight: number = 36,
    LayoutAlgorithm = calculateLayoutWithDagre,
    includeHidden: boolean = false,
    noParentKey: string = 'no-parent'
): Promise<{ updatedNodes: Node[], updatedEdges: Edge[] }> => {

    // Create global temporary edges map once for the recursive processing
    const temporaryEdgesByParent = createGlobalTemporaryEdgesMap(edges, nodeIdWithNode, noParentKey);

    const { updatedNodes: updatedChildNodes } =
        await layoutSingleContainer(
            parentNodeId,
            direction,
            nodeParentIdMapWithChildIdSet,
            nodeIdWithNode,
            edges,
            margin,
            nodeSpacing,
            layerSpacing,
            defaultNodeWidth,
            defaultNodeHeight,
            LayoutAlgorithm,
            includeHidden,
            temporaryEdgesByParent
        );

    const parentNode = nodeIdWithNode.get(parentNodeId);
    if (!parentNode) {
        return { updatedNodes: updatedChildNodes, updatedEdges: edges };
    }

    const { updatedNodes: parentUpdatedNodes } = await organizeLayoutRecursively(
        parentNode.parentId || noParentKey,
        direction,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        defaultNodeWidth,
        defaultNodeHeight,
        LayoutAlgorithm,
        includeHidden,
        noParentKey
    );

    return {
        updatedNodes: [...parentUpdatedNodes, ...updatedChildNodes],
        updatedEdges: edges, // Always return original edges unchanged
    };
}

/**
 * @function layoutSingleContainer
 * Organizes the layout of a single container and its immediate child nodes.
 * By default, it uses the Dagre layout algorithm or the provided algorithm to calculate the positions of the nodes.
 * The function updates the dimensions of the parent node and its child nodes.
 * It also updates the edges of the layout.
 * 
 * @param parentNodeId - The parent node to layout
 * @param direction - The direction of the layout
 * @param nodeParentIdMapWithChildIdSet - A map of parent node ids to their set of child IDs
 * @param nodeIdWithNode - A map of node ids to their nodes
 * @param edges - The edges to layout
 * @param margin - The margin to use for the layout
 * @param nodeSpacing - Spacing between nodes
 * @param layerSpacing - Spacing between layers
 * @param defaultNodeWidth - Default width for nodes without explicit width
 * @param defaultNodeHeight - Default height for nodes without explicit height
 * @param LayoutAlgorithm - The layout algorithm to use
 * @param includeHidden - Whether to include hidden nodes in the layout
 * @returns Promise<{ updatedNodes: Node[], udpatedParentNode?: Node }>
 */
export const layoutSingleContainer = async (
    parentNodeId: string,
    defaultDirection: Direction,
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
    nodeIdWithNode: Map<string, Node>,
    _originalEdges: Edge[], // Only used for returning unaltered edges
    margin: number = MARGIN,
    nodeSpacing: number = 50,
    layerSpacing: number = 50,
    defaultNodeWidth: number = 172,
    defaultNodeHeight: number = 36,
    LayoutAlgorithm = calculateLayoutWithDagre,
    includeHidden: boolean = false,
    temporaryEdgesByParent: Map<string, Edge[]> = new Map() // Global temporary edges map
): Promise<{ updatedNodes: Node[], udpatedParentNode?: Node }> => {
    // Get the set of child IDs for this parent
    const childIdSet = nodeParentIdMapWithChildIdSet.get(parentNodeId);
    if (!childIdSet || childIdSet.size === 0) {
        return { updatedNodes: []};
    }


    // Convert the Set of IDs to an array of actual Node objects
    const nodesToLayout: Node[] = [];
    childIdSet.forEach(childId => {
        const node = nodeIdWithNode.get(childId);
        if (node) {
            nodesToLayout.push(node);
        }
    });

    if (nodesToLayout.length === 0) {
        return { updatedNodes: [] };
    }

    let direction = defaultDirection;
    const parentNode = nodeIdWithNode.get(parentNodeId);
    
    if (parentNode) {
        if (parentNode.data.layoutDirection) {
            direction = parentNode.data.layoutDirection as Direction;
        }
    }

    // Simply get temporary edges for this level - no edge processing needed!
    const temporaryEdgesForLevel = temporaryEdgesByParent.get(parentNodeId) || [];

    const { nodes: layoutedNodes, edges: _, width, height } =
        await LayoutAlgorithm(
            nodesToLayout,
            temporaryEdgesForLevel, // Only use temporary edges for layout
            direction,
            margin,
            nodeSpacing,
            layerSpacing,
            defaultNodeWidth,
            defaultNodeHeight,
            includeHidden
        );

    if (parentNode && width && height) {
        fixParentNodeDimensions(parentNode, width, height);
    }

    return {
        updatedNodes: [...layoutedNodes],
        udpatedParentNode: parentNode || undefined,
    };
}

export const fixParentNodeDimensions = (
    node: Node,
    width: number,
    height: number
): Node => {
    if (!node.style) {
        node.style = {};
    }
    node.width = width;
    node.height = height;
    node.measured = {
        width: width,
        height: height,
    }
    node.style.width = width;
    node.style.height = height;
    return node;
}

/**
 * @function organizeLayoutByTreeDepth
 * Processes parent nodes in order from deepest to shallowest, ensuring proper layout calculation.
 * This function traverses the parent tree and calls layoutSingleContainer for each parent,
 * starting with the deepest children and working up to the root node(s).
 * Finally processes the custom noParentKey node to handle root-level elements.
 * 
 * @param parentTree - The tree structure of parent nodes
 * @param direction - The direction of the layout
 * @param nodeParentIdMapWithChildIdSet - A map of parent node ids to their set of child IDs
 * @param nodeIdWithNode - A map of node ids to their nodes
 * @param edges - The edges to layout
 * @param margin - The margin to use for the layout
 * @param nodeSpacing - Spacing between nodes (horizontal within same rank)
 * @param layerSpacing - Spacing between layers (vertical between ranks)
 * @param defaultNodeWidth - Default width for nodes without explicit width
 * @param defaultNodeHeight - Default height for nodes without explicit height
 * @param LayoutAlgorithm - The layout algorithm to use
 * @param includeHidden - Whether to include hidden nodes in the layout
 * @param noParentKey - Key used to represent nodes without a parent
 * @returns Promise<{ updatedNodes: Node[], updatedEdges: Edge[] }>
 */
export const organizeLayoutByTreeDepth = async (
    parentTree: TreeNode[],
    direction: Direction,
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
    nodeIdWithNode: Map<string, Node>,
    edges: Edge[],
    margin: number = MARGIN,
    nodeSpacing: number = 50,
    layerSpacing: number = 50,
    defaultNodeWidth: number = 172,
    defaultNodeHeight: number = 36,
    LayoutAlgorithm = calculateLayoutWithDagre,
    includeHidden: boolean = false,
    noParentKey: string = 'no-parent'
): Promise<{ updatedNodes: Node[], updatedEdges: Edge[] }> => {
    let allUpdatedNodes: Node[] = [];
    
    // Create global temporary edges map once at the beginning
    const temporaryEdgesByParent = createGlobalTemporaryEdgesMap(edges, nodeIdWithNode, noParentKey);

    // Collect all parent IDs by depth (deepest first)
    const nodesByDepth: Map<number, string[]> = new Map();
    let maxDepth = 0;

    // Function to collect nodes by depth
    const collectNodesByDepth = (nodes: TreeNode[], depth: number) => {
        if (depth > maxDepth) maxDepth = depth;

        for (const node of nodes) {
            if (!nodesByDepth.has(depth)) {
                nodesByDepth.set(depth, []);
            }
            nodesByDepth.get(depth)!.push(node.id);

            if (node.children.length > 0) {
                collectNodesByDepth(node.children, depth + 1);
            }
        }
    };

    // Build depth-ordered collection of nodes
    collectNodesByDepth(parentTree, 0);

    // Process from deepest to shallowest
    for (let depth = maxDepth; depth >= 0; depth--) {
        const parentIds = nodesByDepth.get(depth) || [];

        // Process each parent at this level
        const levelResults = await Promise.all(parentIds.map(parentId =>
            layoutSingleContainer(
                parentId,
                direction,
                nodeParentIdMapWithChildIdSet,
                nodeIdWithNode,
                edges, // Pass original edges (only used for returning)
                margin,
                nodeSpacing,
                layerSpacing,
                defaultNodeWidth,
                defaultNodeHeight,
                LayoutAlgorithm,
                includeHidden,
                temporaryEdgesByParent // Pass the global temporary edges map
            )
        ));

        // Collect only updated nodes (edges are always the same original edges)
        for (const { updatedNodes } of levelResults) {
            allUpdatedNodes = [...updatedNodes, ...allUpdatedNodes];
        }
    }

    // CRITICAL: Process root level with temporary edges
    const { updatedNodes: rootUpdatedNodes } = 
        await layoutSingleContainer(
            noParentKey,
            direction,
            nodeParentIdMapWithChildIdSet,
            nodeIdWithNode,
            edges, // Pass original edges (only used for returning)
            margin,
            nodeSpacing,
            layerSpacing,
            defaultNodeWidth,
            defaultNodeHeight,
            LayoutAlgorithm,
            includeHidden,
            temporaryEdgesByParent // Process root-level temporary edges
        );

    // Final merge
    allUpdatedNodes = [...rootUpdatedNodes, ...allUpdatedNodes];

    return {
        updatedNodes: allUpdatedNodes,
        updatedEdges: edges, // Always return original edges unchanged
    };
}