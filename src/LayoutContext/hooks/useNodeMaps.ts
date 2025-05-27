import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';

interface UseNodeMapsProps {
    nodes: Node[];
    externalNodeIdWithNode?: Map<string, Node>;
    externalNodeParentIdMapWithChildIdSet?: Map<string, Set<string>>;
    noParentKey?: string;
}

export function useNodeMaps({
    nodes,
    externalNodeIdWithNode,
    externalNodeParentIdMapWithChildIdSet,
    noParentKey = 'no-parent'
}: UseNodeMapsProps) {
    const [internalNodeIdWithNode, setInternalNodeIdWithNode] = useState<Map<string, Node>>(new Map());
    const [internalNodeParentIdMapWithChildIdSet, setInternalNodeParentIdMapWithChildIdSet] = useState<Map<string, Set<string>>>(new Map());
    const [parentChildStructure, setParentChildStructure] = useState<Record<string, number>>({});
    const [nodesLength, setNodesLength] = useState<number>(nodes.length);
    const [childrenInitialized, setChildrenInitialized] = useState(false);

    // Use provided maps or internal state
    const nodeIdWithNode = externalNodeIdWithNode || internalNodeIdWithNode;
    const nodeParentIdMapWithChildIdSet = externalNodeParentIdMapWithChildIdSet || internalNodeParentIdMapWithChildIdSet;
    const numberOfNodes = nodeIdWithNode.size;

    // Build internal maps if external maps aren't provided
    useEffect(() => {
        if (!externalNodeIdWithNode || !externalNodeParentIdMapWithChildIdSet) {
            const newNodeIdWithNode = new Map<string, Node>();
            const newNodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
            
            nodes.forEach((node) => {
                newNodeIdWithNode.set(node.id, node);
                
                const parentId = node.parentId || noParentKey;
                if (!newNodeParentIdMapWithChildIdSet.has(parentId)) {
                    newNodeParentIdMapWithChildIdSet.set(parentId, new Set());
                }
                newNodeParentIdMapWithChildIdSet.get(parentId)?.add(node.id);
            });
            
            if (!externalNodeIdWithNode) {
                setInternalNodeIdWithNode(newNodeIdWithNode);
            }
            
            if (!externalNodeParentIdMapWithChildIdSet) {
                setInternalNodeParentIdMapWithChildIdSet(newNodeParentIdMapWithChildIdSet);
            }
        }
    }, [nodes, externalNodeIdWithNode, externalNodeParentIdMapWithChildIdSet, noParentKey]);

    // Update nodes length
    useEffect(() => {
        if(nodes.length !== nodesLength) {
            setNodesLength(nodes.length);
        }
    }, [nodes]);

    // Effect to check when maps are populated
    useEffect(() => {
        if (nodeIdWithNode.size > 0 && nodeParentIdMapWithChildIdSet.size > 0 && !childrenInitialized) {
            setChildrenInitialized(true);
        }
    }, [nodeIdWithNode, nodeParentIdMapWithChildIdSet, childrenInitialized]);

    // Calculate parent-child structure signature
    useEffect(() => {
        const newStructure: Record<string, number> = {};
        nodeParentIdMapWithChildIdSet.forEach((childIdSet, parentId) => {
            newStructure[parentId] = childIdSet.size;
        });
        
        let hasChanged = false;
        for (const key in newStructure) {
            if(!parentChildStructure.hasOwnProperty(key) || newStructure[key] !== parentChildStructure[key]) {
                hasChanged = true;
                break;
            }
        }
        
        if (hasChanged) {
            setParentChildStructure(newStructure);
        }
    }, [nodeParentIdMapWithChildIdSet]);

    return {
        nodeIdWithNode,
        nodeParentIdMapWithChildIdSet,
        numberOfNodes,
        nodesLength,
        childrenInitialized,
        parentChildStructure
    };
}