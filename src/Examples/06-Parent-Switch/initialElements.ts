// Define common styles and position
const position = { x: 0, y: 0 };
const edgeType = 'smoothstep';

// Colors for easy reference and maintenance
const parentColors = {
  parent1: {
    main: '#2196f3',
    background: '#bbdefb20',
  },
  parent2: {
    main: '#4caf50',
    background: '#c8e6c920',
  }
};

// Define parent containers with consistent styling
export const parentContainers = [
  {
    id: 'parent1',
    type: 'input',
    data: { 
      label: 'Parent 1',
      description: 'Blue container - drag nodes here'
    },
    position,
    style: {
      border: `2px solid ${parentColors.parent1.main}`,
      backgroundColor: parentColors.parent1.background,
    },

  },
  {
    id: 'parent2',
    type: 'input',
    data: { 
      label: 'Parent 2',
      description: 'Green container - drag nodes here'
    },
    position,
    style: {
      border: `2px solid ${parentColors.parent2.main}`,
      backgroundColor: parentColors.parent2.background,

    },

  },
];

// Define available parents for node switching
export const availableParents = parentContainers.map(parent => ({
  id: parent.id,
  label: parent.data.label as string,
}));

// Helper to create a switchable node
const createSwitchableNode = (id: string, label: string, parentId: string) => ({
  id,
  type: 'switchable',
  data: { label },
  position,
  parentId,
  extent: 'parent' as const,
});

// Define initial nodes using the helper function
export const initialNodes = [
  createSwitchableNode('node1', 'Switchable Node 1', 'parent1'),
  createSwitchableNode('node2', 'Switchable Node 2', 'parent1'),
  createSwitchableNode('node3', 'Switchable Node 3', 'parent2'),
  createSwitchableNode('node4', 'Switchable Node 4', 'parent2'),
];

// Define edges with consistent styling and unique IDs
export const initialEdges = [
  { id: 'e1-2-001', source: 'node1', target: 'node2', type: edgeType, animated: true },
  { id: 'e2-3-002', source: 'node2', target: 'node3', type: edgeType, animated: true },
  { id: 'e3-4-003', source: 'node3', target: 'node4', type: edgeType, animated: true },
];