import { Node } from "@xyflow/react";


export const createChildNodesToNode = (
    nodes: Node[],
    parentNode: Node
): Node[] => {
    return nodes.map((node: Node) => {
        if (node.id === parentNode.id) {
            return node;
        }
        return {
            ...node,
            parentId: parentNode.id,
            extent: 'parent' as const,
        };
    });
}

export const fixNodeDimensions = (
    node: Node,
    width: number,
    height: number
): Node => {
    if (!node.style) {
        node.style = {};
    }
    node.width = width;
node.height = height;
    node.style.width = width;
    node.style.height = height;
    return node;
}