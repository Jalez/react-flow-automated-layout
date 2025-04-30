import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import filterSelectedParentNodes from '../filterSelectedParentNodes';

describe('filterSelectedParentNodes', () => {
  const createTestSetup = () => {
    // Create test nodes
    const rootNode: Node = {
      id: 'root',
      data: { label: 'Root' },
      position: { x: 0, y: 0 },
    };
    
    const parent1: Node = {
      id: 'parent1',
      data: { label: 'Parent 1' },
      position: { x: 0, y: 0 },
      parentId: 'root',
    };
    
    const parent2: Node = {
      id: 'parent2',
      data: { label: 'Parent 2' },
      position: { x: 0, y: 0 },
      parentId: 'root',
    };
    
    const child1: Node = {
      id: 'child1',
      data: { label: 'Child 1' },
      position: { x: 0, y: 0 },
      parentId: 'parent1',
    };
    
    const child2: Node = {
      id: 'child2',
      data: { label: 'Child 2' },
      position: { x: 0, y: 0 },
      parentId: 'parent1',
    };
    
    const grandchild: Node = {
      id: 'grandchild',
      data: { label: 'Grandchild' },
      position: { x: 0, y: 0 },
      parentId: 'child1',
    };
    
    // Create node maps
    const nodeIdWithNode = new Map<string, Node>();
    nodeIdWithNode.set(rootNode.id, rootNode);
    nodeIdWithNode.set(parent1.id, parent1);
    nodeIdWithNode.set(parent2.id, parent2);
    nodeIdWithNode.set(child1.id, child1);
    nodeIdWithNode.set(child2.id, child2);
    nodeIdWithNode.set(grandchild.id, grandchild);
    
    // Create parent-child relationship map
    const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
    nodeParentIdMapWithChildIdSet.set('root', new Set(['parent1', 'parent2']));
    nodeParentIdMapWithChildIdSet.set('parent1', new Set(['child1', 'child2']));
    nodeParentIdMapWithChildIdSet.set('child1', new Set(['grandchild']));
    nodeParentIdMapWithChildIdSet.set('no-parent', new Set(['root']));
    
    return {
      nodes: [rootNode, parent1, parent2, child1, child2, grandchild],
      nodeIdWithNode,
      nodeParentIdMapWithChildIdSet
    };
  };

  it('should return parent nodes from selection', () => {
    const setup = createTestSetup();
    
    const selectedNodes = [
      setup.nodeIdWithNode.get('parent1')!,
      setup.nodeIdWithNode.get('parent2')!,
    ];
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      setup.nodeParentIdMapWithChildIdSet,
      setup.nodeIdWithNode
    );
    
    // Based on the implementation, since parent1 and parent2 have the same parent (root),
    // the function would give us either parent1 and parent2, or the common parent 'root'
    expect(result.length).toBe(1);
    expect(result).toContain('root');
  });
  
  it('should include parents of selected nodes', () => {
    const setup = createTestSetup();
    
    const selectedNodes = [
      setup.nodeIdWithNode.get('child1')!,
    ];
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      setup.nodeParentIdMapWithChildIdSet,
      setup.nodeIdWithNode
    );
    
    // The function is designed to return the parent of the selected node, not the node itself
    expect(result).toContain('parent1');
    expect(result.length).toBe(1);
  });
  
  it('should filter out nested parent selections', () => {
    const setup = createTestSetup();
    
    // Select both parent and child in the hierarchy
    const selectedNodes = [
      setup.nodeIdWithNode.get('root')!,
      setup.nodeIdWithNode.get('parent1')!,
    ];
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      setup.nodeParentIdMapWithChildIdSet,
      setup.nodeIdWithNode
    );
    
    // Should only include the top-most parent to avoid redundant processing
    expect(result).toEqual(['root']);
    expect(result.length).toBe(1);
  });
  
  it('should return noParentKey when no parent nodes are selected', () => {
    const setup = createTestSetup();
    
    // Use a node that isn't registered as a parent in nodeParentIdMapWithChildIdSet
    const selectedNodes = [
      setup.nodeIdWithNode.get('child2')!,
    ];
    
    // Modify our map to not include child2's parent for this test
    const modifiedMap = new Map(setup.nodeParentIdMapWithChildIdSet);
    modifiedMap.delete('parent1');
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      modifiedMap,
      setup.nodeIdWithNode
    );
    
    expect(result).toEqual(['no-parent']);
  });
  
  it('should use custom noParentKey when provided', () => {
    const setup = createTestSetup();
    
    const selectedNodes = [
      setup.nodeIdWithNode.get('child2')!,
    ];
    
    // Modify our map to not include child2's parent for this test
    const modifiedMap = new Map(setup.nodeParentIdMapWithChildIdSet);
    modifiedMap.delete('parent1');
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      modifiedMap,
      setup.nodeIdWithNode,
      'root-level'
    );
    
    expect(result).toEqual(['root-level']);
  });
  
  it('should handle deep nested selection correctly', () => {
    const setup = createTestSetup();
    
    // Select a grandchild node
    const selectedNodes = [
      setup.nodeIdWithNode.get('grandchild')!,
    ];
    
    const result = filterSelectedParentNodes(
      selectedNodes,
      setup.nodeParentIdMapWithChildIdSet,
      setup.nodeIdWithNode
    );
    
    // The function returns the parent node, not the selected node itself
    expect(result).toContain('child1');
    expect(result.length).toBe(1);
  });
});