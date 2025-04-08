import React from "react";
import { ControlButton } from "@xyflow/react";
import { useLayoutContext } from "../../context/LayoutContext";

interface ApplyLayoutButtonProps {

  compact?: boolean; // Option for compact mode
}

const ApplyLayoutButton: React.FC<ApplyLayoutButtonProps> = ({

  compact = false
}) => {

       const {

    layoutInProgress,
    setLayoutInProgress,
    applyLayout,
        } = useLayoutContext();
  const handleApplyLayout = async () => {
    if (!layoutInProgress) {
      try {
        setLayoutInProgress(true);
        await applyLayout();
      } catch (error) {
        console.error("Error applying layout:", error);
      }
    }
  };

  return (
    <ControlButton
      onClick={handleApplyLayout}
      title="Apply layout"
      disabled={layoutInProgress}
      style={{ color: layoutInProgress ? "#999" : "#000" }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none">
        {/* Graph layout application icon */}
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="16" width="5" height="5" rx="1" />
        <rect x="16" y="16" width="5" height="5" rx="1" />
        {/* Connecting arrows in a layout pattern */}
        <path d="M8 5.5h8M5.5 8v8M18.5 8v8M8 18.5h8" />
        {/* Play/apply icon in the center */}
        <circle cx="12" cy="12" r="3" />
        <path d="M11 10.5v3l2-1.5z" fill="currentColor" />
      </svg>
      {!compact && (
        <span style={{ marginLeft: '4px' }}>Apply Layout</span>
      )}
    </ControlButton>
  );
};

export default ApplyLayoutButton;