import { describe, it, expect } from 'vitest';
import filterSelectedParentNodes from './filterSelectedParentNodes';
import type { Node } from '@xyflow/react';

describe('filterSelectedParentNodes', () => {
  it('returns empty array when no selection', () => {
    expect(filterSelectedParentNodes([], new Map(), new Map())).toEqual([]);
  });

  it('returns ["no-parent"] when no parent nodes selected', () => {
    const parentMap = new Map<string, Node[]>();
    const nodeMap = new Map<string, Node>();
    expect(filterSelectedParentNodes(['child1'], parentMap, nodeMap)).toEqual(['no-parent']);
  });

  it('filters out nested parents and includes only top-level parents with no-parent', () => {
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

    const result = filterSelectedParentNodes(['A', 'B'], parentMap, nodeMap);
    expect(result).toEqual(['no-parent', 'A']);
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
    const result = filterSelectedParentNodes(['A', 'B'], parentMap, nodeMap);
    expect(result).toEqual(['no-parent', 'A', 'B']);
  });

  it('handles missing nodes gracefully', () => {
    const parentMap = new Map<string, Node[]>([['X', []]]);
    const nodeMap = new Map<string, Node>();
    expect(filterSelectedParentNodes(['X'], parentMap, nodeMap)).toEqual(['no-parent', 'X']);
  });

  it('includes parent when only child selected', () => {
    const A: Node = { id: 'A', position: { x: 0, y: 0 }, data: {} };
    const B: Node = { id: 'B', parentId: 'A', position: { x: 0, y: 0 }, data: {} };
    const parentMap = new Map<string, Node[]>([['A', [B]]]);
    const nodeMap = new Map<string, Node>([['A', A], ['B', B]]);
    const result = filterSelectedParentNodes(['B'], parentMap, nodeMap);
    expect(result).toEqual(['no-parent', 'A']);
  });
});