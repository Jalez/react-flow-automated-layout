import React from 'react';
import { Controls } from "@xyflow/react";
import { useLayoutContext } from '../context/LayoutProvider';

// Import the individual control components
import DirectionControls from './controls/DirectionControls';
import SpacingControls from './controls/SpacingControls';
import AutoLayoutToggle from './controls/AutoLayoutToggle';
import ApplyLayoutButton from './controls/ApplyLayoutButton';

interface LayoutControlsProps {
    showDirectionControls?: boolean;
    showSpacingControls?: boolean;
    showAutoLayoutToggle?: boolean;
    showApplyLayoutButton?: boolean; // New prop for the apply layout button
    standalone?: boolean; // Whether to render as standalone controls or integrable buttons
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // For standalone mode only
}

/**
 * Layout controls component that provides UI for controlling layout options
 * Can be used standalone or integrated with React Flow Controls
 */
const LayoutControls: React.FC<LayoutControlsProps> = ({
    showDirectionControls = true,
    showSpacingControls = true,
    showAutoLayoutToggle = true,
    showApplyLayoutButton = true, // Enable by default
    standalone = false,
    position = 'top-right'
}) => {
    const layoutContext = useLayoutContext();

    const {
        autoLayout,
    } = layoutContext;


    // When used as standalone, wrap in Controls component
    if (standalone) {
        return (
            <Controls position={position} showZoom={false} showFitView={false} showInteractive={false}>
                {showApplyLayoutButton && !autoLayout && (
                    <ApplyLayoutButton
                        compact={true}
                    />
                )}

                {showDirectionControls && (
                    <DirectionControls
                        compact={true}
                    />
                )}

                {showSpacingControls && (
                    <SpacingControls
                        compact={true}
                    />
                )}

                {showAutoLayoutToggle && (
                    <AutoLayoutToggle
                        compact={true}
                    />
                )}
            </Controls>
        );
    }

    // Just return the controls for integration with existing Controls component
    return (
        <>
            {showApplyLayoutButton && !autoLayout && (
                <ApplyLayoutButton
                    compact={true}
                />
            )}

            {showDirectionControls && (
                <DirectionControls
                    compact={true}
                />
            )}

            {showSpacingControls && (
                <SpacingControls
                    compact={true}
                />
            )}

            {showAutoLayoutToggle && (
                <AutoLayoutToggle
                    compact={true}
                />
            )}
        </>
    );
};

export default LayoutControls;