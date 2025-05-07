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
  organizeLayoutRecursively: vi.fn().mockImplementation(() => 
    Promise.resolve({ updatedNodes: [], updatedEdges: [] })),
  organizeLayoutByTreeDepth: vi.fn().mockImplementation(() => 
    Promise.resolve({ updatedNodes: [], updatedEdges: [] }))
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
import { processSelectedNodes, LayoutConfig } from '../../hooks/useLayoutCalculation';

// Helper to create a default LayoutConfig for tests
function createLayoutConfig(overrides: Partial<LayoutConfig> = {}): LayoutConfig {
  return {
    dagreDirection: 'TB',
    nodeParentIdMapWithChildIdSet: new Map(),
    nodeIdWithNode: new Map(),
    nodes: [],
    edges: [],
    margin: 10,
    nodeSpacing: 50,
    layerSpacing: 50,
    nodeWidth: 172,
    nodeHeight: 36,
    layoutHidden: false,
    noParentKey: 'no-parent',
    ...overrides,
  };
}

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
    let setup: ReturnType<typeof createTestSetup>;
    let defaultConfig: LayoutConfig;

    beforeEach(() => {
      setup = createTestSetup();
      defaultConfig = createLayoutConfig({
        nodeParentIdMapWithChildIdSet: setup.nodeParentIdMapWithChildIdSet,
        nodeIdWithNode: setup.nodeIdWithNode,
        nodes: setup.nodes,
        edges: setup.edges,
      });
      vi.clearAllMocks();
    });

    it('should process selected nodes by finding parent containers', async () => {
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      vi.mocked(HierarchicalLayoutOrganizer.organizeLayoutRecursively).mockResolvedValueOnce({
        updatedNodes: [
          { ...setup.nodes[0], position: { x: 100, y: 100 } },
          { ...setup.nodes[1], position: { x: 200, y: 100 } }
        ],
        updatedEdges: setup.edges
      });
      
      const selectedNodes: Node[] = [setup.nodes[0]];
      const result = await processSelectedNodes(selectedNodes, defaultConfig);
      
      expect(filterSelectedParentNodes).toHaveBeenCalledWith(
        selectedNodes,
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        'no-parent'
      );
      
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
      
      expect(result.nodes.length).toBe(setup.nodes.length);
      expect(result.edges.length).toBe(setup.edges.length);
    });

    it('should return original nodes and edges when no parent nodes are selected', async () => {
      vi.mocked(filterSelectedParentNodes).mockReturnValue([]);
      const selectedNodes: Node[] = [setup.nodes[0]];
      const result = await processSelectedNodes(selectedNodes, defaultConfig);
      expect(result.nodes).toEqual(setup.nodes);
      expect(result.edges).toEqual(setup.edges);
      expect(HierarchicalLayoutOrganizer.organizeLayoutRecursively).not.toHaveBeenCalled();
    });

    it('should respect the layoutHidden flag', async () => {
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      const selectedNodes: Node[] = [setup.nodes[0]];
      const config = { ...defaultConfig, layoutHidden: true };
      await processSelectedNodes(selectedNodes, config);
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

    it('should use custom noParentKey when provided', async () => {
      vi.mocked(filterSelectedParentNodes).mockReturnValue(['parent']);
      const selectedNodes: Node[] = [setup.nodes[0]];
      const config = { ...defaultConfig, noParentKey: 'root-level' };
      await processSelectedNodes(selectedNodes, config);
      expect(filterSelectedParentNodes).toHaveBeenCalledWith(
        selectedNodes,
        setup.nodeParentIdMapWithChildIdSet,
        setup.nodeIdWithNode,
        'root-level'
      );
    });
  });
});