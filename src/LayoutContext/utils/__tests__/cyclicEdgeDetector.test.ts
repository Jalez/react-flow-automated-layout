import { describe, it, expect } from 'vitest';
import { Edge } from '@xyflow/react';
import { getCyclicEdges } from '../cyclicEdgeDetector';

describe('getCyclicEdges', () => {
    // Helper function to create test edges
    const createEdge = (id: string, source: string, target: string): Edge => ({
        id,
        source,
        target,
        type: 'default'
    });

    describe('Self-loops', () => {
        it('should detect single self-loop', () => {
            const edges = [
                createEdge('edge1', 'A', 'A')
            ];
            const nodeIds = new Set(['A']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            expect(cyclicEdges[0].id).toBe('edge1');
        });

        it('should detect multiple self-loops on same node', () => {
            const edges = [
                createEdge('edge1', 'A', 'A'),
                createEdge('edge2', 'A', 'A')
            ];
            const nodeIds = new Set(['A']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(2);
            expect(cyclicEdges.map(e => e.id)).toContain('edge1');
            expect(cyclicEdges.map(e => e.id)).toContain('edge2');
        });

        it('should detect self-loops on different nodes', () => {
            const edges = [
                createEdge('edge1', 'A', 'A'),
                createEdge('edge2', 'B', 'B'),
                createEdge('edge3', 'A', 'B') // Non-cyclic edge
            ];
            const nodeIds = new Set(['A', 'B']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(2);
            expect(cyclicEdges.map(e => e.id)).toContain('edge1');
            expect(cyclicEdges.map(e => e.id)).toContain('edge2');
            expect(cyclicEdges.map(e => e.id)).not.toContain('edge3');
        });
    });

    describe('Simple cycles', () => {
        it('should detect simple 2-node cycle', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'A')
            ];
            const nodeIds = new Set(['A', 'B']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            // Should detect the back edge (B -> A)
            expect(cyclicEdges[0].id).toBe('edge2');
        });

        it('should detect simple 3-node cycle', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'C'),
                createEdge('edge3', 'C', 'A')
            ];
            const nodeIds = new Set(['A', 'B', 'C']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            // Should detect the back edge (C -> A)
            expect(cyclicEdges[0].id).toBe('edge3');
        });

        it('should detect 4-node cycle', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'C'),
                createEdge('edge3', 'C', 'D'),
                createEdge('edge4', 'D', 'A')
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            expect(cyclicEdges[0].id).toBe('edge4');
        });
    });

    describe('Complex cycles', () => {
        it('should detect multiple separate cycles', () => {
            const edges = [
                // First cycle: A -> B -> A
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'A'),
                
                // Second cycle: C -> D -> C
                createEdge('edge3', 'C', 'D'),
                createEdge('edge4', 'D', 'C'),
                
                // Non-cyclic connection
                createEdge('edge5', 'A', 'C')
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(2);
            expect(cyclicEdges.map(e => e.id)).toContain('edge2');
            expect(cyclicEdges.map(e => e.id)).toContain('edge4');
        });

        it('should detect cycle with branching paths', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'A', 'C'),
                createEdge('edge3', 'B', 'D'),
                createEdge('edge4', 'C', 'D'),
                createEdge('edge5', 'D', 'A') // Creates cycle
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            expect(cyclicEdges[0].id).toBe('edge5');
        });

        it('should handle nested cycles', () => {
            const edges = [
                // Outer cycle: A -> B -> C -> A
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'C'),
                createEdge('edge3', 'C', 'A'),
                
                // Inner connection that creates additional cycle
                createEdge('edge4', 'B', 'A') // Direct back edge
            ];
            const nodeIds = new Set(['A', 'B', 'C']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(2);
            expect(cyclicEdges.map(e => e.id)).toContain('edge3');
            expect(cyclicEdges.map(e => e.id)).toContain('edge4');
        });
    });

    describe('Acyclic graphs', () => {
        it('should return empty array for simple acyclic graph', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'C'),
                createEdge('edge3', 'C', 'D')
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });

        it('should return empty array for tree structure', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'A', 'C'),
                createEdge('edge3', 'B', 'D'),
                createEdge('edge4', 'B', 'E'),
                createEdge('edge5', 'C', 'F')
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D', 'E', 'F']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });

        it('should return empty array for disconnected acyclic components', () => {
            const edges = [
                // Component 1
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'B', 'C'),
                
                // Component 2
                createEdge('edge3', 'D', 'E'),
                createEdge('edge4', 'E', 'F')
            ];
            const nodeIds = new Set(['A', 'B', 'C', 'D', 'E', 'F']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty edges array', () => {
            const edges: Edge[] = [];
            const nodeIds = new Set(['A', 'B']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });

        it('should handle empty nodeIds set', () => {
            const edges = [
                createEdge('edge1', 'A', 'B')
            ];
            const nodeIds = new Set<string>();
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });

        it('should ignore edges with nodes not in nodeIds set', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'), // Both in set
                createEdge('edge2', 'B', 'A'), // Both in set - creates cycle
                createEdge('edge3', 'C', 'D'), // Neither in set
                createEdge('edge4', 'A', 'C')  // Only source in set
            ];
            const nodeIds = new Set(['A', 'B']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            expect(cyclicEdges[0].id).toBe('edge2');
        });

        it('should handle single node with no edges', () => {
            const edges: Edge[] = [];
            const nodeIds = new Set(['A']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(0);
        });
    });

    describe('Multiple edges between same nodes', () => {
        it('should handle multiple edges in same direction', () => {
            const edges = [
                createEdge('edge1', 'A', 'B'),
                createEdge('edge2', 'A', 'B'), // Duplicate direction
                createEdge('edge3', 'B', 'A')  // Creates cycle
            ];
            const nodeIds = new Set(['A', 'B']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(1);
            expect(cyclicEdges[0].id).toBe('edge3');
        });

        it('should handle multiple self-loops and not duplicate them', () => {
            const edges = [
                createEdge('edge1', 'A', 'A'),
                createEdge('edge2', 'A', 'A'),
                createEdge('edge3', 'A', 'A')
            ];
            const nodeIds = new Set(['A']);
            
            const cyclicEdges = getCyclicEdges(edges, nodeIds);
            
            expect(cyclicEdges).toHaveLength(3);
            // All should be unique by id
            const uniqueIds = new Set(cyclicEdges.map(e => e.id));
            expect(uniqueIds.size).toBe(3);
        });
    });
});
