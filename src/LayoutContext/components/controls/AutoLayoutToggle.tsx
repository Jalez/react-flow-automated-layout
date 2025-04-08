import React from "react";
import { ControlButton } from "@xyflow/react";
import { useLayoutContext } from "../../context/LayoutContext";

interface AutoLayoutToggleProps {

  compact?: boolean; // Option for icon-only mode
}

const AutoLayoutToggle: React.FC<AutoLayoutToggleProps> = ({

  compact = false
}) => {

   const {
    autoLayout,
    setAutoLayout,

    } = useLayoutContext();
  const handleToggle = () => {
    const newValue = !autoLayout;
    setAutoLayout(newValue);
    
  };

  return (
    <ControlButton
      onClick={handleToggle}
      className={autoLayout ? "selected" : ""}
      title={autoLayout ? "Disable automatic layout" : "Enable automatic layout"}
      style={{ color: autoLayout ? "green" : "inherit" }}
    >
      {compact ? (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none">
          {/* Auto-layout icon: organized nodes and connections */}
          <rect x="4" y="4" width="4" height="4" rx="1" />
          <rect x="4" y="16" width="4" height="4" rx="1" />
          <rect x="16" y="10" width="4" height="4" rx="1" />

            <>
              {/* Disorganized layout with curved connections */}
              <path d="M8 6c6 0 3 8 8 6" />
              <path d="M8 18c3-3 2-8 6-6" />
            </>
       
        </svg>
      ) : (
        <>Auto-Layout {autoLayout ? "ON" : "OFF"}</>
      )}
    </ControlButton>
  );
};

export default AutoLayoutToggle;
