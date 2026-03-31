import { describe, expect, it } from 'vitest';
import { Edge, Node } from '@xyflow/react';

import { createGlobalTemporaryEdgesMap } from '../temporaryEdgeMapCreator';

describe('temporaryEdgeMapCreator', () => {
  it('marks reciprocal container edges and adds an internal bridge edge', () => {
    const nodes: Node[] = [
      { id: 'root', data: { label: 'root' }, position: { x: 0, y: 0 } },
      { id: 'A', data: { label: 'A' }, position: { x: 0, y: 0 }, parentId: 'root' },
      { id: 'B', data: { label: 'B' }, position: { x: 0, y: 0 }, parentId: 'root' },
      { id: 'A1', data: { label: 'A1' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'A2', data: { label: 'A2' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'B1', data: { label: 'B1' }, position: { x: 0, y: 0 }, parentId: 'B' },
    ];

    const nodeIdWithNode = new Map(nodes.map(node => [node.id, node]));

    const edges: Edge[] = [
      { id: 'A1-B1', source: 'A1', target: 'B1' },
      { id: 'B1-A2', source: 'B1', target: 'A2' },
    ];

    const result = createGlobalTemporaryEdgesMap(edges, nodeIdWithNode);
    const rootEdges = result.get('root') || [];
    const groupAEdges = result.get('A') || [];

    expect(rootEdges).toHaveLength(2);
    expect(rootEdges.every(edge => edge.data?.isReciprocal)).toBe(true);
    expect(rootEdges.map(edge => `${edge.source}->${edge.target}`).sort()).toEqual(['A->B', 'B->A']);

    expect(groupAEdges).toHaveLength(1);
    expect(groupAEdges[0].source).toBe('A1');
    expect(groupAEdges[0].target).toBe('A2');
    expect(groupAEdges[0].data?.isSyntheticBridge).toBe(true);
    expect(groupAEdges[0].data?.bridgeNode).toBe('B1');
  });

  it('does not create synthetic bridge edges when the pivot stays in the same container', () => {
    const nodes: Node[] = [
      { id: 'root', data: { label: 'root' }, position: { x: 0, y: 0 } },
      { id: 'A', data: { label: 'A' }, position: { x: 0, y: 0 }, parentId: 'root' },
      { id: 'A1', data: { label: 'A1' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'A2', data: { label: 'A2' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'A3', data: { label: 'A3' }, position: { x: 0, y: 0 }, parentId: 'A' },
    ];

    const nodeIdWithNode = new Map(nodes.map(node => [node.id, node]));
    const edges: Edge[] = [
      { id: 'A1-A2', source: 'A1', target: 'A2' },
      { id: 'A2-A3', source: 'A2', target: 'A3' },
    ];

    const result = createGlobalTemporaryEdgesMap(edges, nodeIdWithNode);

    expect(result.get('A') || []).toHaveLength(2);
    expect((result.get('A') || []).some(edge => edge.data?.isSyntheticBridge)).toBe(false);
  });

  it('creates bridge edges for nested descendants by projecting to the first child under each layout level', () => {
    const nodes: Node[] = [
      { id: 'root', data: { label: 'root' }, position: { x: 0, y: 0 } },
      { id: 'A', data: { label: 'A' }, position: { x: 0, y: 0 }, parentId: 'root' },
      { id: 'B', data: { label: 'B' }, position: { x: 0, y: 0 }, parentId: 'root' },
      { id: 'A1', data: { label: 'A1' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'A2', data: { label: 'A2' }, position: { x: 0, y: 0 }, parentId: 'A' },
      { id: 'A11', data: { label: 'A11' }, position: { x: 0, y: 0 }, parentId: 'A1' },
      { id: 'A21', data: { label: 'A21' }, position: { x: 0, y: 0 }, parentId: 'A2' },
      { id: 'B1', data: { label: 'B1' }, position: { x: 0, y: 0 }, parentId: 'B' },
    ];

    const nodeIdWithNode = new Map(nodes.map(node => [node.id, node]));
    const edges: Edge[] = [
      { id: 'A11-B1', source: 'A11', target: 'B1' },
      { id: 'B1-A21', source: 'B1', target: 'A21' },
    ];

    const result = createGlobalTemporaryEdgesMap(edges, nodeIdWithNode);

    expect((result.get('root') || []).map(edge => `${edge.source}->${edge.target}`).sort()).toEqual(['A->B', 'B->A']);
    expect(result.get('A') || []).toHaveLength(1);
    expect(result.get('A')?.[0].source).toBe('A1');
    expect(result.get('A')?.[0].target).toBe('A2');
    expect(result.get('A')?.[0].data?.isSyntheticBridge).toBe(true);
    expect(result.get('A')?.[0].data?.bridgeBranch).toBe('B');
  });
});
