import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import * as HierarchicalLayoutOrganizer from '../../core/HierarchicalLayoutOrganizer';

// Mocking the imported modules
vi.mock('../../utils/layoutProviderUtils', () => ({
  convertDirection: vi.fn().mockImplementation(dir => {
    switch (dir) {
      case 'DOWN': return 'TB';
      case 'RIGHT': return 'LR';
      case 'UP': return 'BT';
      case 'LEFT': return 'RL';
      default: return 'TB';
    }
  })
}));

vi.mock('../../core/HierarchicalLayoutOrganizer', () => ({
  organizeLayoutRecursively: vi.fn().mockReturnValue({ 
    updatedNodes: [], 
    updatedEdges: [] 
  }),
  organizeLayoutByTreeDepth: vi.fn().mockReturnValue({ 
    updatedNodes: [], 
    updatedEdges: [] 
  })
}));

vi.mock('../../utils/treeUtils', () => ({
  buildNodeTree: vi.fn().mockReturnValue([])
}));

// Import filterSelectedParentNodes module at the top level
import filterSelectedParentNodes from '../../utils/filterSelectedParentNodes';

// Mock filterSelectedParentNodes module
vi.mock('../../utils/filterSelectedParentNodes', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Import the function under test, not the hook directly
import { processSelectedNodes } from '../../hooks/useLayoutCalculation';

describe('useLayoutCalculation', () => {
  // Test setup with common variables
  const createTestSetup = () => {
    const nodes: Node[] = [
      { id: 'node1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
      { id: 'node2', data: { label: 'Node 2' }, position: { x: 0, y: 0 } },
      { id: 'parent', data: { label: 'Parent' }, position: { x: 0, y: 0 } },
    ];
    
    const edges: Edge[] = [
      { id: 'edge1', source: 'node1', target: 'node2', type: 'default' }
    ];
    
    const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
    nodeParentIdMapWithChildIdSet.set('parent', new Set(['node1', 'node2']));
    nodeParentIdMapWithChildIdSet.set('no-parent', new Set(['parent']));
    
    const nodeIdWithNode = new Map<string, Node>();
    nodes.forEach(node => {
      nodeIdWithNode.set(node.id, node);
    });
    
    return {
      nodes,
      edges,
      nodeParentIdMapWithChildIdSet,
      nodeIdWithNode
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Since we can't test the hook directly without the right library,
  // we'll test the internal processSelectedNodes function which contains
  // most of the hook's logic
  describe('processSelectedNodes', () => {
    it('should process selected nodes by finding parent containers', () => {
      const setup = createTestSetup();
      
      // Set up mock return value for this test only
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      
      // Mock organizeLayoutRecursively to return updated nodes and edges
      vi.mocked(HierarchicalLayoutOrganizer.organizeLayoutRecursively).mockReturnValueOnce({
        updatedNodes: [
          { ...setup.nodes[0], position: { x: 100, y: 100 } },
          { ...setup.nodes[1], position: { x: 200, y: 100 } }
        ],
        updatedEdges: setup.edges
      });
      
      const selectedNodes: Node[] = [setup.nodes[0]]; // Select node1
      
      const result = processSelectedNodes(
        selectedNodes,
        'TB', // Direction
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.nodes,
        setup.edges,
        10, // Margin
        50, // Node spacing
        50, // Layer spacing
        172, // Node width
        36 // Node height
      );
      
      // filterSelectedParentNodes should have been called with the selected nodes
      expect(filterSelectedParentNodes).toHaveBeenCalledWith(
        selectedNodes,
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        'no-parent'
      );
      
      // organizeLayoutRecursively should have been called
      expect(HierarchicalLayoutOrganizer.organizeLayoutRecursively).toHaveBeenCalledWith(
        'parent',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        undefined,
        false
      );
      
      // Result should contain the updated nodes and edges
      expect(result.nodes.length).toBe(setup.nodes.length);
      expect(result.edges.length).toBe(setup.edges.length);
    });
    
    it('should return original nodes and edges when no parent nodes are selected', () => {
      const setup = createTestSetup();
      
      // Mock filterSelectedParentNodes to return an empty array for this test only
      vi.mocked(filterSelectedParentNodes).mockReturnValue([]);
      
      const selectedNodes: Node[] = [setup.nodes[0]]; // Select node1
      
      const result = processSelectedNodes(
        selectedNodes,
        'TB', // Direction
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.nodes,
        setup.edges,
        10, // Margin
        50, // Node spacing
        50, // Layer spacing
        172, // Node width
        36 // Node height
      );
      
      // Since no parent nodes were selected, the original nodes and edges should be returned
      expect(result.nodes).toEqual(setup.nodes);
      expect(result.edges).toEqual(setup.edges);
      
      // organizeLayoutRecursively should not have been called
      expect(HierarchicalLayoutOrganizer.organizeLayoutRecursively).not.toHaveBeenCalled();
    });
    
    it('should respect the layoutHidden flag', () => {
      const setup = createTestSetup();
      
      // Mock filterSelectedParentNodes to return parent node for this test only
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      
      const selectedNodes: Node[] = [setup.nodes[0]]; // Select node1
      
      processSelectedNodes(
        selectedNodes,
        'TB', // Direction
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.nodes,
        setup.edges,
        10, // Margin
        50, // Node spacing
        50, // Layer spacing
        172, // Node width
        36, // Node height
        true // layoutHidden = true
      );
      
      // organizeLayoutRecursively should have been called with layoutHidden = true
      expect(HierarchicalLayoutOrganizer.organizeLayoutRecursively).toHaveBeenCalledWith(
        'parent',
        'TB',
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.edges,
        10,
        50,
        50,
        172,
        36,
        undefined,
        true
      );
    });
    
    it('should use custom noParentKey when provided', () => {
      const setup = createTestSetup();
      
      // Mock filterSelectedParentNodes for this test only
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      
      const selectedNodes: Node[] = [setup.nodes[0]]; // Select node1
      const customNoParentKey = 'root-level';
      
      processSelectedNodes(
        selectedNodes,
        'TB', // Direction
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        setup.nodes,
        setup.edges,
        10, // Margin
        50, // Node spacing
        50, // Layer spacing
        172, // Node width
        36, // Node height
        false, // layoutHidden
        customNoParentKey
      );
      
      // filterSelectedParentNodes should have been called with the custom noParentKey
      expect(filterSelectedParentNodes).toHaveBeenCalledWith(
        selectedNodes,
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        customNoParentKey
      );
    });
  });
});