import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { 
  organizeLayoutRecursively,
  layoutSingleContainer,
  fixParentNodeDimensions,
  organizeLayoutByTreeDepth
} from '../HierarchicalLayoutOrganizer';
import type { Direction } from '../HierarchicalLayoutOrganizer';
import { TreeNode } from '../../utils/treeUtils';
import { LayoutResult } from '../Dagre';

// Mock implementation of calculateLayoutWithDagre that returns a Promise
const mockCalculateLayoutWithDagre = vi.fn(async (
  _nodes: Node[],
  _edges: Edge[],
  _direction: Direction,
  _margin?: number,
  _nodeSpacing?: number,
  _layerSpacing?: number,
  defaultNodeWidth?: number,
  defaultNodeHeight?: number,
  _includeHidden?: boolean
): Promise<LayoutResult> => {
  // Return a mock layout result
  return Promise.resolve({
    nodes: _nodes.map(node => ({
      ...node,
      position: { x: 100, y: 100 },
      width: defaultNodeWidth || 172,
      height: defaultNodeHeight || 36,
      style: {
        ...node.style,
        width: defaultNodeWidth || 172,
        height: defaultNodeHeight || 36
      }
    })),
    edges: _edges,
    width: 300,
    height: 200
  });
});

describe('HierarchicalLayoutOrganizer', () => {
  // Test fixtures
  const createTestSetup = () => {
    // Create test nodes
    const parentNode: Node = {
      id: 'parent1',
      data: { label: 'Parent 1' },
      position: { x: 0, y: 0 },
    };
    
    const childNode1: Node = {
      id: 'child1',
      data: { label: 'Child 1' },
      position: { x: 0, y: 0 },
      parentId: 'parent1',
      extent: 'parent',
    };
    
    const childNode2: Node = {
      id: 'child2',
      data: { label: 'Child 2' },
      position: { x: 0, y: 0 },
      parentId: 'parent1',
      extent: 'parent',
    };
    
    const rootNode: Node = {
      id: 'root1',
      data: { label: 'Root 1' },
      position: { x: 0, y: 0 },
    };
    
    // Create node maps
    const nodeIdWithNode = new Map<string, Node>();
    nodeIdWithNode.set(parentNode.id, parentNode);
    nodeIdWithNode.set(childNode1.id, childNode1);
    nodeIdWithNode.set(childNode2.id, childNode2);
    nodeIdWithNode.set(rootNode.id, rootNode);
    
    // Create parent-child relationship map
    const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
    nodeParentIdMapWithChildIdSet.set('parent1', new Set(['child1', 'child2']));
    nodeParentIdMapWithChildIdSet.set('no-parent', new Set(['parent1', 'root1']));
    
    // Create test edges
    const edges: Edge[] = [
      {
        id: 'edge1',
        source: 'child1',
        target: 'child2',
        type: 'default',
      },
      {
        id: 'edge2',
        source: 'root1',
        target: 'parent1',
        type: 'default',
      },
    ];
    
    return {
      nodes: [parentNode, childNode1, childNode2, rootNode],
      edges,
      nodeIdWithNode,
      nodeParentIdMapWithChildIdSet
    };
  };

  beforeEach(() => {
    // Clear mock call history before each test
    mockCalculateLayoutWithDagre.mockClear();
  });

  describe('fixParentNodeDimensions', () => {
    it('should update a node with new dimensions', () => {
      const parentNode: Node = {
        id: 'parent1',
        data: { label: 'Parent 1' },
        position: { x: 0, y: 0 },
      };

      const updatedNode = fixParentNodeDimensions(parentNode, 300, 200);

      expect(updatedNode.width).toBe(300);
      expect(updatedNode.height).toBe(200);
      expect(updatedNode.style?.width).toBe(300);
      expect(updatedNode.style?.height).toBe(200);
      expect(updatedNode.measured).toEqual({ width: 300, height: 200 });
    });

    it('should maintain existing style properties', () => {
      const parentNode: Node = {
        id: 'parent1',
        data: { label: 'Parent 1' },
        position: { x: 0, y: 0 },
        style: { backgroundColor: 'red', border: '1px solid black' }
      };

      const updatedNode = fixParentNodeDimensions(parentNode, 300, 200);

      expect(updatedNode.style?.backgroundColor).toBe('red');
      expect(updatedNode.style?.border).toBe('1px solid black');
      expect(updatedNode.style?.width).toBe(300);
      expect(updatedNode.style?.height).toBe(200);
    });
  });

  describe('layoutSingleContainer', () => {
    it('should layout a single container with child nodes', async () => {
      const setup = createTestSetup();
      
      const result = await layoutSingleContainer(
        'parent1',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      expect(result.updatedNodes).toHaveLength(2); // Two child nodes
      // No longer returns updatedEdges - simplified architecture
      expect(result.udpatedParentNode).toBeDefined();
      expect(result.udpatedParentNode?.width).toBe(300);
      expect(result.udpatedParentNode?.height).toBe(200);
    });
    
    it('should return empty arrays when no children exist', async () => {
      const setup = createTestSetup();
      
      const result = await layoutSingleContainer(
        'nonexistent',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      expect(result.updatedNodes).toHaveLength(0);
      // No longer returns updatedEdges - simplified architecture
      expect(result.udpatedParentNode).toBeUndefined();
    });
  });

  describe('organizeLayoutRecursively', () => {
    it('should layout nodes recursively up the parent chain', async () => {
      const setup = createTestSetup();
      
      const result = await organizeLayoutRecursively(
        'child1',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      // Expect both parent and child layouts to be calculated
      expect(result.updatedNodes.length).toBeGreaterThan(0);
      expect(result.updatedEdges.length).toBeGreaterThan(0);
      
      // The mock is called 2 times - once for the child1's parent (parent1) 
      // and once for the no-parent container
      expect(mockCalculateLayoutWithDagre).toHaveBeenCalledTimes(2);
    });
    
    it('should handle non-existent parent IDs gracefully', async () => {
      const setup = createTestSetup();
      
      const result = await organizeLayoutRecursively(
        'nonexistent',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      expect(result.updatedNodes).toHaveLength(0);
      // With the new simplified edge handling, original edges are always returned unchanged
      expect(result.updatedEdges).toEqual(setup.edges);
    });
  });

  describe('organizeLayoutByTreeDepth', () => {
    it('should layout nodes from deepest to shallowest level', async () => {
      const setup = createTestSetup();
      
      // Create a proper parent tree matching the TreeNode interface
      const parentTree: TreeNode[] = [
        {
          id: 'no-parent',
          node: { 
            id: 'no-parent', 
            data: { label: 'No Parent' },
            position: { x: 0, y: 0 }
          },
          depth: 0,
          children: [
            {
              id: 'parent1',
              node: setup.nodeIdWithNode.get('parent1')!,
              depth: 1,
              children: [
                {
                  id: 'child1',
                  node: setup.nodeIdWithNode.get('child1')!,
                  depth: 2,
                  children: []
                },
                {
                  id: 'child2',
                  node: setup.nodeIdWithNode.get('child2')!,
                  depth: 2,
                  children: []
                }
              ]
            },
            {
              id: 'root1',
              node: setup.nodeIdWithNode.get('root1')!,
              depth: 1,
              children: []
            }
          ]
        }
      ];
      
      const result = await organizeLayoutByTreeDepth(
        parentTree,
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      expect(result.updatedNodes.length).toBeGreaterThan(0);
      expect(result.updatedEdges.length).toBeGreaterThan(0);
      
      // The mock should be called once for each level in the tree + once for the root level
      expect(mockCalculateLayoutWithDagre).toHaveBeenCalled();
    });
  });

  describe('Edge handling with LCA algorithm', () => {
    it('should handle cross-hierarchy edges correctly', async () => {
      // Create a more complex hierarchy to test edge handling
      const containerA: Node = {
        id: 'containerA',
        data: { label: 'Container A' },
        position: { x: 0, y: 0 },
      };
      
      const containerB: Node = {
        id: 'containerB',
        data: { label: 'Container B' },
        position: { x: 0, y: 0 },
      };
      
      const nodeD: Node = {
        id: 'nodeD',
        data: { label: 'Node D' },
        position: { x: 0, y: 0 },
        parentId: 'containerA',
        extent: 'parent',
      };
      
      const nodeG: Node = {
        id: 'nodeG',
        data: { label: 'Node G' },
        position: { x: 0, y: 0 },
        parentId: 'containerB',
        extent: 'parent',
      };
      
      const nodeIdWithNode = new Map<string, Node>();
      nodeIdWithNode.set('containerA', containerA);
      nodeIdWithNode.set('containerB', containerB);
      nodeIdWithNode.set('nodeD', nodeD);
      nodeIdWithNode.set('nodeG', nodeG);
      
      const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
      nodeParentIdMapWithChildIdSet.set('containerA', new Set(['nodeD']));
      nodeParentIdMapWithChildIdSet.set('containerB', new Set(['nodeG']));
      nodeParentIdMapWithChildIdSet.set('no-parent', new Set(['containerA', 'containerB']));
      
      // Cross-hierarchy edge from nodeD to nodeG
      const edges: Edge[] = [
        {
          id: 'edge-D-G',
          source: 'nodeD',
          target: 'nodeG',
          type: 'default',
        },
      ];
      
      const parentTree: TreeNode[] = [
        {
          id: 'no-parent',
          node: { 
            id: 'no-parent', 
            data: { label: 'No Parent' },
            position: { x: 0, y: 0 }
          },
          depth: 0,
          children: [
            {
              id: 'containerA',
              node: containerA,
              depth: 1,
              children: [
                {
                  id: 'nodeD',
                  node: nodeD,
                  depth: 2,
                  children: []
                }
              ]
            },
            {
              id: 'containerB',
              node: containerB,
              depth: 1,
              children: [
                {
                  id: 'nodeG',
                  node: nodeG,
                  depth: 2,
                  children: []
                }
              ]
            }
          ]
        }
      ];
      
      const result = await organizeLayoutByTreeDepth(
        parentTree,
        'TB',
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        edges,
        10,
        50,
        50,
        172,
        36,
        mockCalculateLayoutWithDagre
      );
      
      // Verify that the original edges are returned unchanged
      expect(result.updatedEdges).toEqual(edges);
      expect(result.updatedEdges[0].source).toBe('nodeD');
      expect(result.updatedEdges[0].target).toBe('nodeG');
      
      // Verify that nodes were processed (though we can't easily test temporary edge creation without exposing internals)
      expect(result.updatedNodes.length).toBeGreaterThan(0);
      
      // Verify the layout algorithm was called for different hierarchy levels
      expect(mockCalculateLayoutWithDagre).toHaveBeenCalled();
    });
  });
});