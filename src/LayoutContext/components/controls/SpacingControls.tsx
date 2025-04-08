import React, { useState } from "react";
import { ControlButton } from "@xyflow/react";
import { useLayoutContext } from "../../context/LayoutContext";

interface SpacingControlsProps {
  compact?: boolean; // Option for compact mode
}

const SpacingControls: React.FC<SpacingControlsProps> = ({

  compact = false
}) => {
  const {
    nodeSpacing,
    layerSpacing,
    setNodeSpacing,
    setLayerSpacing,
    clearLayoutCache,
  } = useLayoutContext();
  const [showSpacingMenu, setShowSpacingMenu] = useState(false);
  
  const handleNodeSpacingChange = (newValue: number) => {
    setNodeSpacing(newValue);
    if (clearLayoutCache) clearLayoutCache();

  };
  
  const handleLayerSpacingChange = (newValue: number) => {
   setLayerSpacing(newValue);
    if (clearLayoutCache) clearLayoutCache();

  };

  // In compact mode, just show a single button that opens a dropdown
  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <ControlButton
          onClick={() => setShowSpacingMenu(!showSpacingMenu)}
          title="Adjust node and layer spacing"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <path d="M7 10v4M17 10v4M10 7h4M10 17h4" />
          </svg>
        </ControlButton>
        
        {showSpacingMenu && (
          <div 
            className="react-flow-spacing-dropdown"
            style={{
              position: 'absolute',
              right: '0',
              top: '100%',
              marginTop: '8px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 10,
              minWidth: '200px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Node Spacing: {nodeSpacing}px</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[50, 100, 150, 200].map(value => (
                  <button 
                    key={value}
                    onClick={() => handleNodeSpacingChange(value)}
                    style={{
                      background: nodeSpacing === value ? '#0041d0' : '#f5f5f5',
                      color: nodeSpacing === value ? 'white' : 'inherit',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Layer Spacing: {layerSpacing}px</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[50, 100, 150, 200].map(value => (
                  <button 
                    key={value}
                    onClick={() => handleLayerSpacingChange(value)}
                    style={{
                      background: layerSpacing === value ? '#0041d0' : '#f5f5f5',
                      color: layerSpacing === value ? 'white' : 'inherit',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <button 
                onClick={() => setShowSpacingMenu(false)}
                style={{
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full spacing controls
  return (
    <div className="spacing-controls">
      <ControlButton
        onClick={() => handleNodeSpacingChange(Math.max(50, nodeSpacing - 25))}
        title="Decrease node spacing"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <line x1="7" y1="10" x2="7" y2="14" />
          <line x1="17" y1="10" x2="17" y2="14" />
          <line x1="10" y1="7" x2="14" y2="7" />
          <line x1="10" y1="17" x2="14" y2="17" />
        </svg>
        <span style={{ marginLeft: '4px' }}>-</span>
      </ControlButton>

      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '5px 10px',
        fontSize: '12px',
        background: '#f8f8f8',
        borderRadius: '4px',
        margin: '0 4px',
        border: '1px solid #ddd'
      }}>
        {nodeSpacing}px
      </div>

      <ControlButton
        onClick={() => handleNodeSpacingChange(Math.min(300, nodeSpacing + 25))}
        title="Increase node spacing"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <line x1="7" y1="10" x2="7" y2="14" />
          <line x1="17" y1="10" x2="17" y2="14" />
          <line x1="10" y1="7" x2="14" y2="7" />
          <line x1="10" y1="17" x2="14" y2="17" />
        </svg>
        <span style={{ marginLeft: '4px' }}>+</span>
      </ControlButton>

      <div style={{ display: 'inline-block', width: '1px', height: '24px', background: '#ddd', margin: '0 10px' }} />

      <ControlButton
        onClick={() => handleLayerSpacingChange(Math.max(50, layerSpacing - 25))}
        title="Decrease layer spacing"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span style={{ marginLeft: '4px' }}>-</span>
      </ControlButton>

      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '5px 10px',
        fontSize: '12px',
        background: '#f8f8f8',
        borderRadius: '4px',
        margin: '0 4px',
        border: '1px solid #ddd'
      }}>
        {layerSpacing}px
      </div>

      <ControlButton
        onClick={() => handleLayerSpacingChange(Math.min(300, layerSpacing + 25))}
        title="Increase layer spacing"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span style={{ marginLeft: '4px' }}>+</span>
      </ControlButton>
    </div>
  );
};

export default SpacingControls;
