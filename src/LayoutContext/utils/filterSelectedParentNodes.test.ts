import { describe, it, expect } from 'vitest';
import filterSelectedParentNodes from './filterSelectedParentNodes';
import type { Node } from '@xyflow/react';

describe('filterSelectedParentNodes', () => {
  it('returns ["no-parent"] when no selection', () => {
    const parentMap = new Map<string, Node[]>();
    const nodeMap = new Map<string, Node>();
    expect(filterSelectedParentNodes([], parentMap, nodeMap)).toEqual(['no-parent']);
  });

  it('returns ["no-parent"] when no parent nodes selected', () => {
    const child: Node = { id: 'child1', position: { x: 0, y: 0 }, data: {} };
    const parentMap = new Map<string, Node[]>();
    const nodeMap = new Map<string, Node>();
    expect(filterSelectedParentNodes([child], parentMap, nodeMap)).toEqual(['no-parent']);
  });

  it('filters out nested parents and returns only top-level parent', () => {
    const A: Node = { id: 'A', position: { x: 0, y: 0 }, data: {} };
    const B: Node = { id: 'B', parentId: 'A', position: { x: 0, y: 0 }, data: {} };
    const C: Node = { id: 'C', parentId: 'B', position: { x: 0, y: 0 }, data: {} };

    const parentMap = new Map<string, Node[]>([
      ['A', [B]],
      ['B', [C]],
    ]);
    const nodeMap = new Map<string, Node>([
      ['A', A],
      ['B', B],
      ['C', C],
    ]);

    const result = filterSelectedParentNodes([A, B], parentMap, nodeMap);
    expect(result).toEqual(['A']);
  });

  it('includes all parents when no nested parent relationship', () => {
    const A: Node = { id: 'A', position: { x: 0, y: 0 }, data: {} };
    const B: Node = { id: 'B', position: { x: 0, y: 0 }, data: {} };
    const parentMap = new Map<string, Node[]>([
      ['A', []],
      ['B', []],
    ]);
    const nodeMap = new Map<string, Node>([
      ['A', A],
      ['B', B],
    ]);
    const result = filterSelectedParentNodes([A, B], parentMap, nodeMap);
    expect(result).toEqual(['A', 'B']);
  });

  it('handles missing nodes gracefully', () => {
    const X: Node = { id: 'X', position: { x: 0, y: 0 }, data: {} };
    const parentMap = new Map<string, Node[]>([['X', []]]);
    const nodeMap = new Map<string, Node>();
    expect(filterSelectedParentNodes([X], parentMap, nodeMap)).toEqual(['X']);
  });

  it('includes parent when only child selected', () => {
    const A: Node = { id: 'A', position: { x: 0, y: 0 }, data: {} };
    const B: Node = { id: 'B', parentId: 'A', position: { x: 0, y: 0 }, data: {} };
    const parentMap = new Map<string, Node[]>([['A', [B]]]);
    const nodeMap = new Map<string, Node>([['A', A], ['B', B]]);
    const result = filterSelectedParentNodes([B], parentMap, nodeMap);
    expect(result).toEqual(['A']);
  });
});