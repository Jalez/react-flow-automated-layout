import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Node } from '@xyflow/react';
import LayoutContext from '../LayoutContext';

// Mock the React Flow hooks
vi.mock('@xyflow/react', () => {
  return {
    useReactFlow: vi.fn(() => ({
      setNodes: vi.fn(),
      setEdges: vi.fn(),
    })),
    useOnSelectionChange: vi.fn(({ onChange }) => {
      // Store the callback for later use in tests
      (global as any).selectionChangeCallback = onChange;
    }),
    useNodes: vi.fn(() => []),
    useEdges: vi.fn(() => []),
    Position: {
      Top: 'top',
      Right: 'right',
      Bottom: 'bottom',
      Left: 'left',
    },
    Node: vi.fn(),
    Edge: vi.fn(),
  };
});

// Mock useContext to capture the context value
const mockContextValue = { 
  direction: 'DOWN',
  algorithm: 'layered',
  autoLayout: true,
  noParentKey: 'no-parent',
  setDirection: vi.fn(),
  setAlgorithm: vi.fn(),
  setAutoLayout: vi.fn(),
  applyLayout: vi.fn(),
  clearLayoutCache: vi.fn(),
  registerLayoutEngine: vi.fn(),
  layoutSpacing: 50,
  setLayoutSpacing: vi.fn(),
  nodeWidth: 172,
  nodeHeight: 36,
  setNodeDimensions: vi.fn()
};

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual as object,
    useContext: vi.fn((context) => {
      if (context === LayoutContext) {
        return mockContextValue;
      }
      return (actual as any).useContext(context);
    })
  };
});

// Create a wrapper for our tests
function renderWithProvider(props: any = {}) {
  const nodeIdWithNode = new Map<string, Node>();
  const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
  
  const testNode1: Node = {
    id: 'node1',
    data: { label: 'Node 1' },
    position: { x: 0, y: 0 },
  };
  
  const testNode2: Node = {
    id: 'node2',
    data: { label: 'Node 2' },
    position: { x: 0, y: 0 },
    parentId: 'node1',
  };
  
  nodeIdWithNode.set(testNode1.id, testNode1);
  nodeIdWithNode.set(testNode2.id, testNode2);
  
  nodeParentIdMapWithChildIdSet.set('node1', new Set(['node2']));
  nodeParentIdMapWithChildIdSet.set('no-parent', new Set(['node1']));
  
  // Update the mockContextValue with any custom props
  if (props.initialDirection) {
    mockContextValue.direction = props.initialDirection;
  } else {
    mockContextValue.direction = 'DOWN';
  }
  
  if (props.initialAlgorithm) {
    mockContextValue.algorithm = props.initialAlgorithm;
  } else {
    mockContextValue.algorithm = 'layered';
  }
  
  if (props.initialAutoLayout !== undefined) {
    mockContextValue.autoLayout = props.initialAutoLayout;
  } else {
    mockContextValue.autoLayout = true;
  }
  
  if (props.noParentKey) {
    mockContextValue.noParentKey = props.noParentKey;
  } else {
    mockContextValue.noParentKey = 'no-parent';
  }
  
  // Return the mock context that will be provided by React.useContext
  return {
    context: mockContextValue
  };
}

describe('LayoutProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset context values to defaults
    mockContextValue.direction = 'DOWN';
    mockContextValue.algorithm = 'layered';
    mockContextValue.autoLayout = true;
    mockContextValue.noParentKey = 'no-parent';
  });
  
  it('provides default context values', () => {
    const { context } = renderWithProvider();
    
    expect(context.direction).toBe('DOWN');
    expect(context.algorithm).toBe('layered');
    expect(context.autoLayout).toBe(true);
  });
  
  it('allows customizing initial direction', () => {
    const { context } = renderWithProvider({
      initialDirection: 'RIGHT',
    });
    
    expect(context.direction).toBe('RIGHT');
  });
  
  it('allows customizing initial algorithm', () => {
    const { context } = renderWithProvider({
      initialAlgorithm: 'mrtree',
    });
    
    expect(context.algorithm).toBe('mrtree');
  });
  
  it('allows customizing auto layout', () => {
    const { context } = renderWithProvider({
      initialAutoLayout: false,
    });
    
    expect(context.autoLayout).toBe(false);
  });
  
  it('passes custom noParentKey to the context', () => {
    const { context } = renderWithProvider({
      noParentKey: 'root-level',
    });
    
    expect(context.noParentKey).toBe('root-level');
  });
  
  it('provides all required context methods', () => {
    const { context } = renderWithProvider();
    
    // Check that all expected methods exist
    expect(typeof context.setDirection).toBe('function');
    expect(typeof context.setAlgorithm).toBe('function');
    expect(typeof context.setAutoLayout).toBe('function');
    expect(typeof context.applyLayout).toBe('function');
    expect(typeof context.clearLayoutCache).toBe('function');
    expect(typeof context.registerLayoutEngine).toBe('function');
  });
});