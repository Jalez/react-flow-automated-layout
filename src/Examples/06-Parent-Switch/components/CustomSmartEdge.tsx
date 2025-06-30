import React from 'react';
import { useNodes, BezierEdge, EdgeProps } from '@xyflow/react';
import { getSmartEdge } from '@jalez/react-flow-smart-edge';

/**
 * Custom Smart Edge with configurable node avoidance settings
 */
export const CustomSmartEdge: React.FC<EdgeProps> = (props) => {
    const {
        id,
        sourcePosition,
        targetPosition,
        sourceX,
        sourceY,
        targetX,
        targetY,
        style,
        markerStart,
        markerEnd,
    } = props;

    const nodes = useNodes();

    const getSmartEdgeResponse = getSmartEdge({
        sourcePosition,
        targetPosition,
        sourceX,
        sourceY,
        targetX,
        targetY,
        nodes: nodes as any, // Type assertion to handle version compatibility
        options: {
            // Increase padding around nodes for more clearance
            nodePadding: 20, // Default is 10, increase for more space around nodes
            
            // Adjust grid ratio for pathfinding accuracy
            gridRatio: 8, // Default is 10, smaller = more accurate but slower
        }
    });

    // If pathfinding fails, fall back to regular bezier edge
    if (getSmartEdgeResponse === null) {
        return <BezierEdge {...props} />;
    }

    const { svgPathString } = getSmartEdgeResponse;

    return (
        <path
            id={id}
            style={style}
            className="react-flow__edge-path"
            d={svgPathString}
            markerEnd={markerEnd}
            markerStart={markerStart}
        />
    );
};

export default CustomSmartEdge;
