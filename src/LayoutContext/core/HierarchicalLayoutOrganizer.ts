import { Edge, Node } from "@xyflow/react";
import { calculateLayoutWithDagre } from "./LayoutElementsWithDagre";
import { TreeNode } from "../utils/treeUtils";

export type Direction = 'TB' | 'LR' | 'RL' | 'BT';

const getEdgesOfNodes = (nodes: Node[], edges: Edge[]): Edge[] => {
    return edges.filter((edge) => {
        return nodes.some((node) => {
            return edge.source === node.id || edge.target === node.id;
        });
    });
}

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
 * @returns { updatedNodes: Node[], updatedEdges: Edge[] }
 */
export const organizeLayoutRecursively = (
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
    LayoutAlgorithm = calculateLayoutWithDagre
): { updatedNodes: Node[], updatedEdges: Edge[] } => {

    const { updatedNodes: updatedChildNodes, updatedEdges: updatedChildEdges } =
        layoutSingleContainer(
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
            LayoutAlgorithm
        );

    const parentNode = nodeIdWithNode.get(parentNodeId);
    if (!parentNode) {
        return { updatedNodes: updatedChildNodes, updatedEdges: updatedChildEdges };
    }

    const { updatedNodes: parentUpdatedNodes, updatedEdges: parentUpdatedEdges } = organizeLayoutRecursively(
        parentNode.parentId || "no-parent",
        direction,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        defaultNodeWidth,
        defaultNodeHeight,
        LayoutAlgorithm
    );

    return {
        updatedNodes: [...parentUpdatedNodes, ...updatedChildNodes],
        updatedEdges: [...parentUpdatedEdges, ...updatedChildEdges],
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
 * @returns { updatedNodes: Node[], updatedEdges: Edge[], udpatedParentNode?: Node }
 */
export const layoutSingleContainer = (
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
    LayoutAlgorithm = calculateLayoutWithDagre
): { updatedNodes: Node[], updatedEdges: Edge[], udpatedParentNode?: Node } => {
    // Get the set of child IDs for this parent
    const childIdSet = nodeParentIdMapWithChildIdSet.get(parentNodeId);
    if (!childIdSet) {
        return { updatedNodes: [], updatedEdges: [] };
    }

    if (childIdSet.size === 0) {
        return { updatedNodes: [], updatedEdges: [] };
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
        return { updatedNodes: [], updatedEdges: [] };
    }

    const edgesToLayout = getEdgesOfNodes(nodesToLayout, edges);
    const { nodes: layoutedNodes, edges: layoutedEdges, width, height } =
        LayoutAlgorithm(
            nodesToLayout,
            edgesToLayout,
            direction,
            margin,
            nodeSpacing,
            layerSpacing,
            defaultNodeWidth,
            defaultNodeHeight
        );

    const parentNode = nodeIdWithNode.get(parentNodeId);
    if (parentNode && width && height) {
        fixParentNodeDimensions(parentNode, width, height);
    }

    return {
        updatedNodes: [...layoutedNodes],
        updatedEdges: [...layoutedEdges],
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
 * Finally processes the "no-parent" node to handle root-level elements.
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
 * @returns { updatedNodes: Node[], updatedEdges: Edge[] }
 */
export const organizeLayoutByTreeDepth = (
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
    LayoutAlgorithm = calculateLayoutWithDagre
): { updatedNodes: Node[], updatedEdges: Edge[] } => {
    // Array to store all updated nodes and edges
    let allUpdatedNodes: Node[] = [];
    let allUpdatedEdges: Edge[] = [];

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

        for (const parentId of parentIds) {
            const { updatedNodes, updatedEdges } = layoutSingleContainer(
                parentId,
                direction,
                nodeParentIdMapWithChildIdSet,
                nodeIdWithNode,
                edges,
                margin,
                nodeSpacing,
                layerSpacing,
                defaultNodeWidth,
                defaultNodeHeight,
                LayoutAlgorithm
            );

            // Merge with already processed nodes and edges
            allUpdatedNodes = [...updatedNodes, ...allUpdatedNodes];
            allUpdatedEdges = [...updatedEdges, ...allUpdatedEdges];
        }
    }

    // Finally, process "no-parent" to handle root-level elements
    const { updatedNodes: rootUpdatedNodes, updatedEdges: rootUpdatedEdges } = layoutSingleContainer(
        "no-parent",
        direction,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        defaultNodeWidth,
        defaultNodeHeight,
        LayoutAlgorithm
    );

    // Merge with already processed nodes and edges
    allUpdatedNodes = [...rootUpdatedNodes, ...allUpdatedNodes];
    allUpdatedEdges = [...rootUpdatedEdges, ...allUpdatedEdges];

    return {
        updatedNodes: allUpdatedNodes,
        updatedEdges: allUpdatedEdges,
    };
}