import { Edge, Node } from "@xyflow/react";
import { calculateLayoutWithDagre } from "./Dagre";
import { TreeNode } from "../utils/treeUtils";
import { createGlobalTemporaryEdgesMap } from "../utils/temporaryEdgeMapCreator";
import { findLCAWithChildren, getFirstChildUnderAncestor } from "../utils/treeUtils";

export type Direction = 'TB' | 'LR' | 'RL' | 'BT';



const MARGIN = 10;

type BridgeAlignmentHint = {
    anchorContainerId: string;
    bridgeContainerId: string;
    sourceNodeId: string;
    targetNodeId: string;
};

const getNodeById = (nodes: Node[], nodeId: string): Node | undefined =>
    nodes.find(node => node.id === nodeId);

const getRelativeNodeCenter = (
    nodeId: string,
    ancestorId: string,
    nodeIdWithNode: Map<string, Node>
): { x: number; y: number } | null => {
    const node = nodeIdWithNode.get(nodeId);
    if (!node) {
        return null;
    }

    let x = node.position.x + (node.width || Number(node.style?.width) || 172) / 2;
    let y = node.position.y + (node.height || Number(node.style?.height) || 36) / 2;
    let currentParentId = node.parentId;

    while (currentParentId && currentParentId !== ancestorId) {
        const parentNode = nodeIdWithNode.get(currentParentId);
        if (!parentNode) {
            break;
        }

        x += parentNode.position.x;
        y += parentNode.position.y;
        currentParentId = parentNode.parentId;
    }

    return { x, y };
};

const getNodeDimensions = (node: Node) => ({
    width: node.width || Number(node.style?.width) || 172,
    height: node.height || Number(node.style?.height) || 36,
});

const getNodeCenter = (node: Node) => {
    const { width, height } = getNodeDimensions(node);
    return {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
    };
};

const normalizeLayoutedNodes = (
    nodes: Node[],
    margin: number
): { nodes: Node[]; width: number; height: number } => {
    if (nodes.length === 0) {
        return { nodes, width: 0, height: 0 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    nodes.forEach(node => {
        const { width, height } = getNodeDimensions(node);
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
    });

    const offsetX = margin - minX;
    const offsetY = margin - minY;

    nodes.forEach(node => {
        node.position = {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
        };
    });

    const width = maxX - minX + margin * 2;
    const height = maxY - minY + margin * 2;

    return { nodes, width, height };
};

const resolveSiblingCollisions = (
    nodes: Node[],
    direction: Direction,
    nodeSpacing: number,
    movedNodeIds: Set<string>
) => {
    if (nodes.length < 2 || movedNodeIds.size === 0) {
        return;
    }

    if (direction === 'TB' || direction === 'BT') {
        const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);
        sortedNodes.forEach((node, index) => {
            if (!movedNodeIds.has(node.id)) {
                return;
            }

            let rightEdge = node.position.x + getNodeDimensions(node).width;

            for (let i = index + 1; i < sortedNodes.length; i++) {
                const sibling = sortedNodes[i];
                const { width } = getNodeDimensions(sibling);
                const minX = rightEdge + nodeSpacing;

                if (sibling.position.x < minX) {
                    sibling.position.x = minX;
                }

                rightEdge = sibling.position.x + width;
            }
        });
    } else {
        const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
        sortedNodes.forEach((node, index) => {
            if (!movedNodeIds.has(node.id)) {
                return;
            }

            let bottomEdge = node.position.y + getNodeDimensions(node).height;

            for (let i = index + 1; i < sortedNodes.length; i++) {
                const sibling = sortedNodes[i];
                const { height } = getNodeDimensions(sibling);
                const minY = bottomEdge + nodeSpacing;

                if (sibling.position.y < minY) {
                    sibling.position.y = minY;
                }

                bottomEdge = sibling.position.y + height;
            }
        });
    }
};

const findBridgeAlignmentHints = (
    parentNodeId: string,
    originalEdges: Edge[],
    nodeIdWithNode: Map<string, Node>,
    noParentKey: string
): BridgeAlignmentHint[] => {
    const incomingByPivot = new Map<string, Edge[]>();
    const outgoingByPivot = new Map<string, Edge[]>();

    originalEdges.forEach(edge => {
        const incoming = incomingByPivot.get(edge.target) || [];
        incoming.push(edge);
        incomingByPivot.set(edge.target, incoming);

        const outgoing = outgoingByPivot.get(edge.source) || [];
        outgoing.push(edge);
        outgoingByPivot.set(edge.source, outgoing);
    });

    const hints = new Map<string, BridgeAlignmentHint>();

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

                if (incomingLca !== parentNodeId || outgoingLca !== parentNodeId) {
                    return;
                }

                const anchorContainerId = getFirstChildUnderAncestor(
                    incomingEdge.source,
                    parentNodeId,
                    nodeIdWithNode,
                    noParentKey
                );
                const targetContainerAtLevel = getFirstChildUnderAncestor(
                    outgoingEdge.target,
                    parentNodeId,
                    nodeIdWithNode,
                    noParentKey
                );
                const bridgeContainerAtLevel = getFirstChildUnderAncestor(
                    pivotNodeId,
                    parentNodeId,
                    nodeIdWithNode,
                    noParentKey
                );

                if (!anchorContainerId || !targetContainerAtLevel || !bridgeContainerAtLevel) {
                    return;
                }

                if (anchorContainerId !== targetContainerAtLevel || anchorContainerId === bridgeContainerAtLevel) {
                    return;
                }

                const sourceProjectedId = getFirstChildUnderAncestor(
                    incomingEdge.source,
                    anchorContainerId,
                    nodeIdWithNode,
                    noParentKey
                );
                const targetProjectedId = getFirstChildUnderAncestor(
                    outgoingEdge.target,
                    anchorContainerId,
                    nodeIdWithNode,
                    noParentKey
                );

                if (!sourceProjectedId || !targetProjectedId || sourceProjectedId === targetProjectedId) {
                    return;
                }

                const key = `${anchorContainerId}:${bridgeContainerAtLevel}:${sourceProjectedId}:${targetProjectedId}`;
                hints.set(key, {
                    anchorContainerId,
                    bridgeContainerId: bridgeContainerAtLevel,
                    sourceNodeId: sourceProjectedId,
                    targetNodeId: targetProjectedId,
                });
            });
        });
    });

    return [...hints.values()];
};

const applyBridgeAlignmentHints = (
    layoutedNodes: Node[],
    parentNodeId: string,
    direction: Direction,
    nodeSpacing: number,
    originalEdges: Edge[],
    nodeIdWithNode: Map<string, Node>,
    noParentKey: string
): Set<string> => {
    const hints = findBridgeAlignmentHints(parentNodeId, originalEdges, nodeIdWithNode, noParentKey);
    const movedNodeIds = new Set<string>();

    hints.forEach(hint => {
        const anchorContainer = getNodeById(layoutedNodes, hint.anchorContainerId);
        const bridgeContainer = getNodeById(layoutedNodes, hint.bridgeContainerId);

        if (!anchorContainer || !bridgeContainer) {
            return;
        }

        const sourceCenter = getRelativeNodeCenter(hint.sourceNodeId, parentNodeId, nodeIdWithNode);
        const targetCenter = getRelativeNodeCenter(hint.targetNodeId, parentNodeId, nodeIdWithNode);

        if (!sourceCenter || !targetCenter) {
            return;
        }

        const { width: bridgeWidth, height: bridgeHeight } = getNodeDimensions(bridgeContainer);
        const { width: anchorWidth, height: anchorHeight } = getNodeDimensions(anchorContainer);
        const originalAnchorCenter = getNodeCenter(anchorContainer);
        const originalBridgeCenter = getNodeCenter(bridgeContainer);

        if (direction === 'TB' || direction === 'BT') {
            const midpointY = (sourceCenter.y + targetCenter.y) / 2;
            bridgeContainer.position.y = midpointY - bridgeHeight / 2;

            const bridgeIsOnRight = originalBridgeCenter.x >= originalAnchorCenter.x;
            const currentHorizontalGap = bridgeIsOnRight
                ? bridgeContainer.position.x - (anchorContainer.position.x + anchorWidth)
                : anchorContainer.position.x - (bridgeContainer.position.x + bridgeWidth);
            const enforcedGap = Math.max(nodeSpacing, currentHorizontalGap);

            bridgeContainer.position.x = bridgeIsOnRight
                ? anchorContainer.position.x + anchorWidth + enforcedGap
                : anchorContainer.position.x - bridgeWidth - enforcedGap;
        } else {
            const midpointX = (sourceCenter.x + targetCenter.x) / 2;
            bridgeContainer.position.x = midpointX - bridgeWidth / 2;

            const bridgeIsBelow = originalBridgeCenter.y >= originalAnchorCenter.y;
            const currentVerticalGap = bridgeIsBelow
                ? bridgeContainer.position.y - (anchorContainer.position.y + anchorHeight)
                : anchorContainer.position.y - (bridgeContainer.position.y + bridgeHeight);
            const enforcedGap = Math.max(nodeSpacing, currentVerticalGap);

            bridgeContainer.position.y = bridgeIsBelow
                ? anchorContainer.position.y + anchorHeight + enforcedGap
                : anchorContainer.position.y - bridgeHeight - enforcedGap;
        }

        movedNodeIds.add(bridgeContainer.id);
    });

    return movedNodeIds;
};

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
            temporaryEdgesByParent,
            noParentKey
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
    ,
    noParentKey: string = 'no-parent'
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

    const { nodes: layoutedNodes, edges: _ } =
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

    layoutedNodes.forEach(node => {
        nodeIdWithNode.set(node.id, node);
    });

    const movedNodeIds = applyBridgeAlignmentHints(
        layoutedNodes,
        parentNodeId,
        direction,
        nodeSpacing,
        _originalEdges,
        nodeIdWithNode,
        noParentKey
    );

    resolveSiblingCollisions(
        layoutedNodes,
        direction,
        nodeSpacing,
        movedNodeIds
    );

    layoutedNodes.forEach(node => {
        nodeIdWithNode.set(node.id, node);
    });

    const normalizedLayout = normalizeLayoutedNodes(layoutedNodes, margin);

    normalizedLayout.nodes.forEach(node => {
        nodeIdWithNode.set(node.id, node);
    });

    if (parentNode && normalizedLayout.width && normalizedLayout.height) {
        fixParentNodeDimensions(parentNode, normalizedLayout.width, normalizedLayout.height);
    }

    return {
        updatedNodes: [...normalizedLayout.nodes],
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
                temporaryEdgesByParent, // Pass the global temporary edges map
                noParentKey
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
            temporaryEdgesByParent, // Process root-level temporary edges
            noParentKey
        );

    // Final merge
    allUpdatedNodes = [...rootUpdatedNodes, ...allUpdatedNodes];

    return {
        updatedNodes: allUpdatedNodes,
        updatedEdges: edges, // Always return original edges unchanged
    };
}
