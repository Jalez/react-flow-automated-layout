import React, { useState } from 'react';
import { useLayoutContext } from '../../../LayoutContext';
import SelectedNodesControl from './SelectedNodesControl';

// Custom styles as JavaScript objects
const styles = {
  customLayoutControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minWidth: '250px',
  },
  controlSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  controlLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#555',
  },
  directionButtons: {
    display: 'flex',
    gap: '5px',
  },
  directionButton: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    background: '#f5f5f5',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    flex: 1,
  },
  directionButtonActive: {
    background: '#0041d0',
    color: 'white',
    borderColor: '#0035b0',
  },
  spacingSlider: {
    width: '100%',
    height: '6px',
    WebkitAppearance: 'none',
    background: '#e0e0e0',
    borderRadius: '3px',
    outline: 'none',
  },
  toggleSwitch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '40px',
    height: '20px',
    marginRight: '10px',
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '34px',
  },
  toggleSliderChecked: {
    backgroundColor: '#4caf50',
  },
  toggleLabel: {
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  applyLayoutButton: {
    padding: '8px 16px',
    background: '#0041d0',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  applyLayoutButtonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
};

// Custom toggle switch component that works with inline styles
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <label style={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={styles.toggleInput}
        />
        <span 
          style={{
            ...styles.toggleSlider,
            ...(checked ? styles.toggleSliderChecked : {})
          }}
        >
          <span 
            style={{
              position: 'absolute',
              height: '16px',
              width: '16px',
              left: checked ? '22px' : '2px',
              bottom: '2px',
              backgroundColor: 'white',
              transition: '.4s',
              borderRadius: '50%',
            }}
          />
        </span>
      </label>
      <span style={styles.toggleLabel}>{checked ? 'ON' : 'OFF'}</span>
    </div>
  );
};

// Custom layout controls that showcase how to use the useLayoutContext hook
const CustomLayoutControls = () => {
  // Access layout context state and methods
  const {
    direction,
    autoLayout,
    nodeSpacing,
    layoutInProgress,
    setDirection,
    setAutoLayout,
    setNodeSpacing,
    setLayerSpacing,
    applyLayout
  } = useLayoutContext();
  
  // Local state for the spacing slider
  const [spacing, setSpacing] = useState(nodeSpacing);
  
  // Custom handler for applying the layout
  const handleApplyLayout = async () => {
    if (!layoutInProgress) {
      try {
        await applyLayout();
      } catch (error) {
        console.error('Error applying layout:', error);
      }
    }
  };
  
  // Custom handler for toggling auto-layout
  const toggleAutoLayout = () => {
    setAutoLayout(!autoLayout);
  };
  
  // Custom handler for updating node spacing with a delay
  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSpacing(value);
  };
  
  // Apply spacing when slider interaction ends
  const applySpacingChange = () => {
    setNodeSpacing(spacing);
    setLayerSpacing(spacing);
  };
  
  return (
    <div style={styles.customLayoutControls}>
      {/* Custom direction controls */}
      <div style={styles.controlSection}>
        <div style={styles.controlLabel}>Layout Direction:</div>
        <div style={styles.directionButtons}>
          {(['DOWN', 'RIGHT', 'UP', 'LEFT'] as const).map((dir) => (
            <button
              key={dir}
              style={{
                ...styles.directionButton,
                ...(direction === dir ? styles.directionButtonActive : {})
              }}
              onClick={() => setDirection(dir)}
              title={`Set direction to ${dir}`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom spacing control */}
      <div style={styles.controlSection}>
        <div style={styles.controlLabel}>Spacing: {spacing}px</div>
        <div>
          <input
            type="range"
            min="20"
            max="200"
            value={spacing}
            onChange={handleSpacingChange}
            onMouseUp={applySpacingChange}
            onTouchEnd={applySpacingChange}
          />
        </div>
      </div>
      
      {/* Auto layout toggle */}
      <div style={styles.controlSection}>
        <div style={styles.controlLabel}>Auto Layout:</div>
        <ToggleSwitch checked={autoLayout} onChange={toggleAutoLayout} />
      </div>
      
      {/* Apply layout button (only shown when auto-layout is off) */}
      {!autoLayout && (
        <div style={styles.controlSection}>
          <button
            style={{
              ...styles.applyLayoutButton,
              ...(layoutInProgress ? styles.applyLayoutButtonDisabled : {})
            }}
            onClick={handleApplyLayout}
            disabled={layoutInProgress}
          >
            {layoutInProgress ? 'Applying...' : 'Apply Layout'}
          </button>
        </div>
      )}
      
      {/* Add the SelectedNodesControl component for specialized selection-based operations */}
      <SelectedNodesControl />
    </div>
  );
};

export default CustomLayoutControls;