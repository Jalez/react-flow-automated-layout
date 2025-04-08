import React from "react";
import { ControlButton } from "@xyflow/react";
import { LayoutDirection, useLayoutContext } from "../../context/LayoutContext";

interface DirectionControlsProps {
  compact?: boolean; // Option for compact mode with just icons
}

const DirectionControls: React.FC<DirectionControlsProps> = ({

  compact = false,
}) => {

   const {
    direction,
    setDirection,
      clearLayoutCache,
    } = useLayoutContext();
  const handleDirectionChange = (newDirection: LayoutDirection) => {
    setDirection(newDirection);
    if (clearLayoutCache) {
      clearLayoutCache();
    }
  };

  // In compact mode, just toggle between DOWN and RIGHT
  if (compact) {
    return (
      <ControlButton
        onClick={() => handleDirectionChange(direction === "DOWN" ? "RIGHT" : "DOWN")}
        title={`Switch to ${direction === "DOWN" ? "horizontal" : "vertical"} layout`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          {direction === "DOWN" ? (
            // Horizontal layout icon
            <path d="M4 12h16M16 6l6 6-6 6" />
          ) : (
            // Vertical layout icon
            <path d="M12 4v16M6 16l6 6 6-6" />
          )}
        </svg>
      </ControlButton>
    );
  }

  // Full direction controls
  return (
    <>
      <ControlButton
        onClick={() => handleDirectionChange("DOWN")}
        className={direction === "DOWN" ? "selected" : ""}
        title="Top to Bottom"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 4v16M6 16l6 6 6-6" />
        </svg>
      </ControlButton>

      <ControlButton
        onClick={() => handleDirectionChange("RIGHT")}
        className={direction === "RIGHT" ? "selected" : ""}
        title="Left to Right"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M4 12h16M16 6l6 6-6 6" />
        </svg>
      </ControlButton>

      <ControlButton
        onClick={() => handleDirectionChange("LEFT")}
        className={direction === "LEFT" ? "selected" : ""}
        title="Right to Left"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M20 12H4M8 6L2 12l6 6" />
        </svg>
      </ControlButton>

      <ControlButton
        onClick={() => handleDirectionChange("UP")}
        className={direction === "UP" ? "selected" : ""}
        title="Bottom to Top"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 20V4M6 8l6-6 6 6" />
        </svg>
      </ControlButton>
    </>
  );
};

export default DirectionControls;
