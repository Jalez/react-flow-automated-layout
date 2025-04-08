
const position = { x: 0, y: 0 };
const edgeType = 'smoothstep';
 
export const parentNode = {
id: '0',
  type: 'group',
  data: {},
  position,
style: {
    width: 400,
    height: 400,
    border: '1px solid #000',
  },
parentId: '0parent',
extent: 'parent' as const,
};

export const parentNodesSibling = {
id: '0sibling',
  type: 'group',
  data: {},
  position,
style: {
    width: 400,
    height: 400,
    border: '1px solid #000',
  },
  parentId: '0parent',
  extent: 'parent' as const,
};

export const parentNodesParent = {
id: '0parent',
  type: 'group',
  data: {},
  position,
style: {
    width: 400,
    height: 400,
    border: '1px solid #000',
  },
};

export const initialNodes = [
  //Parent node for all

  {
    id: '1',
    type: 'input',
    data: { label: 'input' },
    position,
  },
  {
    id: '2',
    data: { label: 'node 2' },
    position,

  },
  {
    id: '2a',
    data: { label: 'node 2a' },
    position,

  },
  {
    id: '2b',
    data: { label: 'node 2b' },
    position,
  },
  {
    id: '2c',
    data: { label: 'node 2c' },
    position,
  },
  {
    id: '2d',
    data: { label: 'node 2d' },
    position,
  },
  {
    id: '3',
    data: { label: 'node 3' },
    position,
  },
  {
    id: '4',
    data: { label: 'node 4' },
    position,
  },
  {
    id: '5',
    data: { label: 'node 5' },
    position,
  },
  {
    id: '6',
    type: 'output',
    data: { label: 'output' },
    position,
  },
  { id: '7', type: 'output', data: { label: 'output' }, position },
{
    id: '8',
    
    data: { label: 'output' },
    position,
  },
  {
id: '9',
    data: { label: 'output' },
    position,
  },
  {
    id: '10',
    data: { label: 'output' },
    position,
  },
];

export const initialNodes2 = [
  {
    id: '11',
    data: { label: 'node 11' },
    position,
  },
  {
    id: '12',
    data: { label: 'node 12' },
    position,
  },
  {
    id: '13',
    data: { label: 'node 13' },
    position,
  },
  {
    id: '14',
    data: { label: 'node 14' },
    position,
  },
]
 



export const initialEdges = [
  //Separate tree
  { id: 'e12', source: '1', target: '2', type: edgeType, animated: true },
  { id: 'e13', source: '1', target: '3', type: edgeType, animated: true },
  { id: 'e22a', source: '2', target: '2a', type: edgeType, animated: true },
  { id: 'e22b', source: '2', target: '2b', type: edgeType, animated: true },
  { id: 'e22c', source: '2', target: '2c', type: edgeType, animated: true },
  { id: 'e2c2d', source: '2c', target: '2d', type: edgeType, animated: true },
  //Separate tree
  { id: 'e45', source: '4', target: '5', type: edgeType, animated: true },
  { id: 'e56', source: '5', target: '6', type: edgeType, animated: true },
  { id: 'e57', source: '5', target: '7', type: edgeType, animated: true },
  //Separate tree
  { id: 'e89', source: '8', target: '9', type: edgeType, animated: true },
  { id: 'e910', source: '9', target: '10', type: edgeType, animated: true },
  //Separate tree
  { id: 'e1112', source: '11', target: '12', type: edgeType, animated: true },
  { id: 'e1113', source: '11', target: '13', type: edgeType, animated: true },
  { id: 'e1114', source: '11', target: '14', type: edgeType, animated: true },


];