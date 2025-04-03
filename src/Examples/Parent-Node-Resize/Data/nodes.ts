export const initialNodes = [
    {
      id: 'A',
      type: 'group',
      position: { x: 0, y: 0 },
      style: {
        width: 170,
        height: 140,
      },
      data: {}, // Added empty data object
    },
    {
      id: 'A-1',
      type: 'input',
      data: { label: 'Child Node 1' },
      position: { x: 10, y: 10 },
      parentId: 'A',
      extent: 'parent' as const,
    },
    {
      id: 'A-2',
      data: { label: 'Child Node 2' },
      position: { x: 10, y: 90 },
      parentId: 'A',
      extent: 'parent' as const,
    },
    {
      id: 'B',
      type: 'output',
      position: { x: -100, y: 200 },
      data: {}, // Changed from null to empty object
      style: {
        width: 170,
        height: 140,
        backgroundColor: 'rgba(240,240,240,0.25)',
      },
    },
    {
      id: 'B-1',
      data: { label: 'Child 1' },
      position: { x: 50, y: 10 },
      parentId: 'B',
      extent: 'parent' as const,
      draggable: false,
      style: {
        width: 60,
      },
    },
    {
      id: 'B-2',
      data: { label: 'Child 2' },
      position: { x: 10, y: 90 },
      parentId: 'B',
      extent: 'parent' as const,
      draggable: false,
      style: {
        width: 60,
      },
    },
    {
      id: 'B-3',
      data: { label: 'Child 3' },
      position: { x: 100, y: 90 },
      parentId: 'B',
      extent: 'parent' as const,
      draggable: false,
      style: {
        width: 60,
      },
    },
    {
      id: 'C',
      type: 'output',
      position: { x: 100, y: 200 },
      data: { label: 'Node C' },
    },
  ];