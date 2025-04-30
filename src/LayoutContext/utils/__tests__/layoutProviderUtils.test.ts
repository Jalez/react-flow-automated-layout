import { describe, it, expect } from 'vitest';
import { Node, Position } from '@xyflow/react';
import { 
  convertDirection, 
  convertDirectionToLayout,
  updateHandlePositions,
  getSourcePosition,
  getTargetPosition
} from '../layoutProviderUtils';
import { LayoutDirection } from '../../context/LayoutContext';

describe('layoutProviderUtils', () => {
  describe('convertDirection', () => {
    it('should convert layout directions to engine directions', () => {
      expect(convertDirection('DOWN')).toBe('TB');
      expect(convertDirection('RIGHT')).toBe('LR');
      expect(convertDirection('UP')).toBe('BT');
      expect(convertDirection('LEFT')).toBe('RL');
    });

    it('should handle invalid input', () => {
      // @ts-expect-error - Testing with invalid input
      expect(convertDirection('INVALID')).toBe('TB');
      // @ts-expect-error - Testing with undefined
      expect(convertDirection(undefined)).toBe('TB');
    });
  });

  describe('convertDirectionToLayout', () => {
    it('should convert engine directions to layout directions', () => {
      expect(convertDirectionToLayout('TB')).toBe('DOWN');
      expect(convertDirectionToLayout('LR')).toBe('RIGHT');
      expect(convertDirectionToLayout('BT')).toBe('UP');
      expect(convertDirectionToLayout('RL')).toBe('LEFT');
    });

    it('should handle invalid input', () => {
      // @ts-expect-error - Testing with invalid input
      expect(convertDirectionToLayout('INVALID')).toBe('DOWN');
      // @ts-expect-error - Testing with undefined
      expect(convertDirectionToLayout(undefined)).toBe('DOWN');
    });
  });

  describe('updateHandlePositions', () => {
    it('should update node handle positions based on direction', () => {
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
          sourcePosition: Position.Top,
          targetPosition: Position.Bottom,
        },
      ];

      const direction: LayoutDirection = 'RIGHT';
      
      const updatedNodes = updateHandlePositions(nodes, direction);
      
      expect(updatedNodes[0].sourcePosition).toBe(Position.Right);
      expect(updatedNodes[0].targetPosition).toBe(Position.Left);
      expect(updatedNodes[1].sourcePosition).toBe(Position.Right);
      expect(updatedNodes[1].targetPosition).toBe(Position.Left);
    });

    it('should not modify nodes if handles already have correct position', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          data: { label: 'Node 1' },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        },
        {
          id: 'node2',
          data: { label: 'Node 2' },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        },
      ];

      const direction: LayoutDirection = 'RIGHT';
      
      const updatedNodes = updateHandlePositions(nodes, direction);
      
      // Should return original array instance (no change needed)
      expect(updatedNodes).toBe(nodes);
    });
  });

  describe('getSourcePosition', () => {
    it('should return correct source position for each direction', () => {
      expect(getSourcePosition('DOWN')).toBe(Position.Bottom);
      expect(getSourcePosition('RIGHT')).toBe(Position.Right);
      expect(getSourcePosition('UP')).toBe(Position.Top);
      expect(getSourcePosition('LEFT')).toBe(Position.Left);
    });

    it('should handle invalid input', () => {
      // @ts-expect-error - Testing with invalid input
      expect(getSourcePosition('INVALID')).toBe(Position.Bottom);
    });
  });

  describe('getTargetPosition', () => {
    it('should return correct target position for each direction', () => {
      expect(getTargetPosition('DOWN')).toBe(Position.Top);
      expect(getTargetPosition('RIGHT')).toBe(Position.Left);
      expect(getTargetPosition('UP')).toBe(Position.Bottom);
      expect(getTargetPosition('LEFT')).toBe(Position.Right);
    });

    it('should handle invalid input', () => {
      // @ts-expect-error - Testing with invalid input
      expect(getTargetPosition('INVALID')).toBe(Position.Top);
    });
  });
});