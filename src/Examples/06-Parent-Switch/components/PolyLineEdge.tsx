    import React from 'react';
    import { EdgeProps, getBezierPath } from '@xyflow/react';

    interface Point {
    x: number;
    y: number;
    }

    interface PolylineEdgeData {
    points?: Point[];
    }

    // PolylineEdge component:
    export const PolylineEdge: React.FC<EdgeProps> = ({ 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY,
    sourcePosition,
    targetPosition,
    data 
    }) => {
    const edgeData = data as PolylineEdgeData;
    
    if (edgeData?.points && edgeData.points.length > 0) {
        // Use custom polyline path if points are provided
        const d = edgeData.points
        .map((p: Point, i: number) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
        .join(' ');
        return     <g className="react-flow__edge polyline-edge">
        <path
            id={id}
            d={d}
            style={{ stroke: 'blue', strokeWidth: 2 }}
            className="react-flow__edge-path"
            fill="none"
        />
        </g>
    } else {
        // Fall back to default bezier path
        const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        });
        return <path id={id} d={edgePath} stroke="blue" strokeWidth={2} fill="none" />;
    }
    };