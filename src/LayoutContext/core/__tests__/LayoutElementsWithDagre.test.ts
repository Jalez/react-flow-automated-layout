import { describe, it, expect, vi } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { calculateLayoutWithDagre } from '../LayoutElementsWithDagre';
import * as layoutProviderUtils from '../../utils/layoutProviderUtils';

// Mock the layoutProviderUtils functions
vi.mock('../../utils/layoutProviderUtils', () => ({
  convertDirectionToLayout: vi.fn().mockReturnValue('TB'),
  getSourcePosition: vi.fn().mockReturnValue('bottom'),
  getTargetPosition: vi.fn().mockReturnValue('top'),
}));

describe('LayoutElementsWithDagre', () => {
  describe('calculateLayoutWithDagre', () => {
    // Test setup function
    const createTestNodes = (): Node[] => [
      {
        id: 'node1',
        data: { label: 'Node 1' },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node2',
        data: { label: 'Node 2' },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node3',
        data: { label: 'Node 3' },
        position: { x: 0, y: 0 },
      },
    ];

    const createTestEdges = (): Edge[] => [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
      },
      {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
      },
    ];

    it('should apply layout to nodes and edges', () => {
      const nodes = createTestNodes();
      const edges = createTestEdges();

      const result = calculateLayoutWithDagre(
        nodes,
        edges,
        'TB',
        10,
        50,
        50,
        172,
        36
      );

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);

      // Verify node positions are updated
      result.nodes.forEach(node => {
        expect(node.position.x).not.toBe(0);
        expect(node.position.y).not.toBe(0);
        expect(node.sourcePosition).toBe('bottom');
        expect(node.targetPosition).toBe('top');
        expect(node.selected).toBe(false);
      });
    });

    it('should use default values for node width and height if not provided', () => {
      const nodes = createTestNodes();
      const edges = createTestEdges();

      const result = calculateLayoutWithDagre(nodes, edges, 'TB');

      expect(result.nodes).toHaveLength(3);
      
      // Verify default values are used
      // Note: We can't directly test the internal dagre graph values,
      // but we can check the result is computed with reasonable dimensions
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should use node dimensions from style if available', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          data: { label: 'Node 1' },
          position: { x: 0, y: 0 },
          style: { width: 200, height: 100 }
        },
        {
          id: 'node2',
          data: { label: 'Node 2' },
          position: { x: 0, y: 0 },
        },
      ];

      const edges = [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        },
      ];

      const result = calculateLayoutWithDagre(
        nodes,
        edges,
        'TB',
        10,
        50,
        50,
        172,
        36
      );

      expect(result.nodes).toHaveLength(2);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should exclude hidden nodes when includeHidden is false', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          data: { label: 'Node 1' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'node2',
          data: { label: 'Node 2' },
          position: { x: 0, y: 0 },
          hidden: true
        },
        {
          id: 'node3',
          data: { label: 'Node 3' },
          position: { x: 0, y: 0 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        },
        {
          id: 'edge2',
          source: 'node2',
          target: 'node3',
        },
      ];

      const result = calculateLayoutWithDagre(
        nodes,
        edges,
        'TB',
        10,
        50,
        50,
        172,
        36,
        false // includeHidden = false
      );

      expect(result.nodes).toHaveLength(2); // Should exclude the hidden node
      expect(result.edges).toHaveLength(2); // All edges should still be included
    });
    
    it('should include hidden nodes when includeHidden is true', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          data: { label: 'Node 1' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'node2',
          data: { label: 'Node 2' },
          position: { x: 0, y: 0 },
          hidden: true
        },
      ];

      const edges: Edge[] = [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        },
      ];

      const result = calculateLayoutWithDagre(
        nodes,
        edges,
        'TB',
        10,
        50,
        50,
        172,
        36,
        true // includeHidden = true
      );

      expect(result.nodes).toHaveLength(2); // All nodes should be included
    });

    it('should handle empty node array', () => {
      const result = calculateLayoutWithDagre([], [], 'TB');
      
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it('should call helper functions with correct direction', () => {
      const nodes = createTestNodes();
      const edges = createTestEdges();

      calculateLayoutWithDagre(nodes, edges, 'LR');
      
      expect(layoutProviderUtils.convertDirectionToLayout).toHaveBeenCalledWith('LR');
    });
  });
});