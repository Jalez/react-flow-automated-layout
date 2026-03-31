import { Edge, Node } from '@xyflow/react';

const position = { x: 0, y: 0 };

const containerStyle = (borderColor: string, backgroundColor: string) => ({
  width: 280,
  height: 240,
  border: `2px solid ${borderColor}`,
  borderRadius: 16,
  backgroundColor,
  padding: 10,
});

const nestedContainerStyle = (borderColor: string, backgroundColor: string) => ({
  width: 180,
  height: 130,
  border: `2px solid ${borderColor}`,
  borderRadius: 12,
  backgroundColor,
  padding: 8,
});

export const rootContainer: Node = {
  id: 'root',
  type: 'group',
  data: { label: 'Root' },
  position,
  draggable: false,
  selectable: false,
  style: {
    width: 980,
    height: 500,
    border: '2px dashed #94a3b8',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
  },
};

export const groupA: Node = {
  id: 'A',
  type: 'group',
  data: { label: 'Group A' },
  position,
  parentId: 'root',
  extent: 'parent',
  style: containerStyle('#2563eb', '#dbeafe55'),
};

export const groupB: Node = {
  id: 'B',
  type: 'group',
  data: { label: 'Group B' },
  position,
  parentId: 'root',
  extent: 'parent',
  style: containerStyle('#ea580c', '#fed7aa55'),
};

export const groupC: Node = {
  id: 'C',
  type: 'group',
  data: { label: 'Group C' },
  position,
  parentId: 'root',
  extent: 'parent',
  style: containerStyle('#16a34a', '#dcfce755'),
};

export const childNodes: Node[] = [
  {
    id: 'A1',
    type: 'group',
    data: { label: 'A1' },
    position,
    parentId: 'A',
    extent: 'parent',
    style: nestedContainerStyle('#60a5fa', '#eff6ff'),
  },
  {
    id: 'A2',
    type: 'group',
    data: { label: 'A2' },
    position,
    parentId: 'A',
    extent: 'parent',
    style: nestedContainerStyle('#3b82f6', '#dbeafe'),
  },
  {
    id: 'A3',
    type: 'group',
    data: { label: 'A3' },
    position,
    parentId: 'A',
    extent: 'parent',
    style: nestedContainerStyle('#2563eb', '#bfdbfe'),
  },
  {
    id: 'B1',
    data: { label: 'B1' },
    position,
    parentId: 'B',
    extent: 'parent',
  },
  {
    id: 'B2',
    data: { label: 'B2' },
    position,
    parentId: 'B',
    extent: 'parent',
  },
  {
    id: 'B3',
    data: { label: 'B3' },
    position,
    parentId: 'B',
    extent: 'parent',
  },
  {
    id: 'A11',
    data: { label: 'A11' },
    position,
    parentId: 'A1',
    extent: 'parent',
  },
  {
    id: 'A12',
    data: { label: 'A12' },
    position,
    parentId: 'A1',
    extent: 'parent',
  },
  {
    id: 'A21',
    data: { label: 'A21' },
    position,
    parentId: 'A2',
    extent: 'parent',
  },
  {
    id: 'A22',
    data: { label: 'A22' },
    position,
    parentId: 'A2',
    extent: 'parent',
  },
  {
    id: 'A31',
    data: { label: 'A31' },
    position,
    parentId: 'A3',
    extent: 'parent',
  },
  {
    id: 'A32',
    data: { label: 'A32' },
    position,
    parentId: 'A3',
    extent: 'parent',
  },
  {
    id: 'C1',
    type: 'group',
    data: { label: 'C1' },
    position,
    parentId: 'C',
    extent: 'parent',
    style: nestedContainerStyle('#22c55e', '#f0fdf4'),
  },
  {
    id: 'C2',
    type: 'group',
    data: { label: 'C2' },
    position,
    parentId: 'C',
    extent: 'parent',
    style: nestedContainerStyle('#16a34a', '#dcfce7'),
  },
  {
    id: 'C11',
    data: { label: 'C11' },
    position,
    parentId: 'C1',
    extent: 'parent',
  },
  {
    id: 'C12',
    data: { label: 'C12' },
    position,
    parentId: 'C1',
    extent: 'parent',
  },
  {
    id: 'C21',
    data: { label: 'C21' },
    position,
    parentId: 'C2',
    extent: 'parent',
  },
];

export const initialNodes: Node[] = [
  rootContainer,
  groupA,
  groupB,
  groupC,
  ...childNodes,
];

export const initialEdges: Edge[] = [
  {
    id: 'A11-B1',
    source: 'A11',
    target: 'B1',
    zIndex: 1000,
  },
  {
    id: 'B1-A21',
    source: 'B1',
    target: 'A21',
    zIndex: 1000,
  },
  {
    id: 'A12-B2',
    source: 'A12',
    target: 'B2',
    zIndex: 1000,
  },
  {
    id: 'B2-A31',
    source: 'B2',
    target: 'A31',
    zIndex: 1000,
  },
  {
    id: 'A11-A12',
    source: 'A11',
    target: 'A12',
    zIndex: 1000,
  },
  {
    id: 'A21-A22',
    source: 'A21',
    target: 'A22',
    zIndex: 1000,
  },
  {
    id: 'A22-A32',
    source: 'A22',
    target: 'A32',
    zIndex: 1000,
  },
  {
    id: 'A31-A32',
    source: 'A31',
    target: 'A32',
    zIndex: 1000,
  },
  {
    id: 'B1-B2',
    source: 'B1',
    target: 'B2',
    zIndex: 1000,
  },
  {
    id: 'B2-B3',
    source: 'B2',
    target: 'B3',
    zIndex: 1000,
  },
  {
    id: 'C11-C12',
    source: 'C11',
    target: 'C12',
    zIndex: 1000,
  },
  {
    id: 'C12-C21',
    source: 'C12',
    target: 'C21',
    zIndex: 1000,
  },
];
