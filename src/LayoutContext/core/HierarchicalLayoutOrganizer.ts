import { Edge, Node } from "@xyflow/react";
import { calculateLayoutWithDagre } from "./Dagre";
import { TreeNode } from "../utils/treeUtils";

export type Direction = 'TB' | 'LR' | 'RL' | 'BT';

const getEdgesOfNodes = (nodeIdSet: Set<string>, edges: Edge[], nodeIdWithNode: Map<string, Node>): {
    alteredEdges: Edge[],
    unalteredEdges: Edge[]

} => {
    const alteredEdges: Edge[] = [];
    const unalteredEdges: Edge[] = [];
    for (const edge of edges) {
        //if the source is a node or the target is a node, we will add it to both edge sets
        if (nodeIdSet.has(edge.source) || nodeIdSet.has(edge.target)) {
            unalteredEdges.push(JSON.parse(JSON.stringify(edge)));
            //If both source and target are not in the nodeIdSet, we will need to 
            if (!nodeIdSet.has(edge.target)) {
                const childNode = nodeIdWithNode.get(edge.target);
                if (childNode && childNode.parentId) {
                    const parentNode = nodeIdWithNode.get(childNode.parentId);
                    if (parentNode) {
                        edge.target = parentNode.id;
                    }
                }
            }
            else if (!nodeIdSet.has(edge.source)) {
                const childNode = nodeIdWithNode.get(edge.source);
                if (childNode && childNode.parentId) {
                    const parentNode = nodeIdWithNode.get(childNode.parentId);
                    if (parentNode) {
                        edge.source = parentNode.id;
                    }
                }
            }
            alteredEdges.push(edge);
        }
       
    }

   
    return {
        alteredEdges: alteredEdges,
        unalteredEdges: unalteredEdges,
    }
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

    const { updatedNodes: updatedChildNodes, updatedEdges: updatedChildEdges } =
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
            includeHidden
        );

    const parentNode = nodeIdWithNode.get(parentNodeId);
    if (!parentNode) {
        return { updatedNodes: updatedChildNodes, updatedEdges: updatedChildEdges };
    }

    const { updatedNodes: parentUpdatedNodes, updatedEdges: parentUpdatedEdges } = await organizeLayoutRecursively(
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
 * @param includeHidden - Whether to include hidden nodes in the layout
 * @returns Promise<{ updatedNodes: Node[], updatedEdges: Edge[], udpatedParentNode?: Node }>
 */
export const layoutSingleContainer = async (
    parentNodeId: string,
    defaultDirection: Direction,
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
): Promise<{ updatedNodes: Node[], updatedEdges: Edge[], udpatedParentNode?: Node }> => {
    // Get the set of child IDs for this parent
    const childIdSet = nodeParentIdMapWithChildIdSet.get(parentNodeId);
    if (!childIdSet || childIdSet.size === 0) {
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
    let direction = defaultDirection;
    const parentNode = nodeIdWithNode.get(parentNodeId);
    if (parentNode) {
        if (parentNode.data.layoutDirection) {
            direction = parentNode.data.layoutDirection as Direction;
        }

    }

    const { alteredEdges, unalteredEdges } = getEdgesOfNodes(childIdSet, edges, nodeIdWithNode);


    const { nodes: layoutedNodes, edges: _, width, height } =
        await LayoutAlgorithm(
            nodesToLayout,
            alteredEdges,
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
        updatedEdges: [...unalteredEdges],
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

        // Process each level in parallel
        const levelResults = await Promise.all(parentIds.map(parentId =>
            layoutSingleContainer(
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
                LayoutAlgorithm,
                includeHidden
            )
        ));

        // Merge results from this level
        for (const { updatedNodes, updatedEdges } of levelResults) {
            allUpdatedNodes = [...updatedNodes, ...allUpdatedNodes];
            allUpdatedEdges = [...updatedEdges, ...allUpdatedEdges];
        }
    }

    // Finally, process noParentKey to handle root-level elements
    const { updatedNodes: rootUpdatedNodes, updatedEdges: rootUpdatedEdges } = await layoutSingleContainer(
        noParentKey,
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
        includeHidden
    );

    // Merge with already processed nodes and edges
    allUpdatedNodes = [...rootUpdatedNodes, ...allUpdatedNodes];
    allUpdatedEdges = [...rootUpdatedEdges, ...allUpdatedEdges];

    return {
        updatedNodes: allUpdatedNodes,
        updatedEdges: allUpdatedEdges,
    };
}