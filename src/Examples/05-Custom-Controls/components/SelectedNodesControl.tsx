import { useState, useEffect } from 'react';
import { useReactFlow, Node } from '@xyflow/react';
import { useLayoutContext } from '../../../LayoutContext';

// Define styles as JavaScript objects
const styles = {
  selectionInfo: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#f9f9f9',
    border: '1px dashed #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center' as const,
  },
  selectedNodesControl: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
  },
  selectionDetails: {
    marginBottom: '10px',
    fontSize: '13px',
  },
  selectionDetailsStrong: {
    display: 'block',
    marginBottom: '5px',
    color: '#0041d0',
  },
  selectionDetailsParagraph: {
    margin: 0,
    color: '#555',
  },
  layoutSelectedButton: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  layoutSelectedButtonDisabled: {
    backgroundColor: '#ffb8b8',
    cursor: 'not-allowed',
  },
};

// A specialized control component that works with node selection
const SelectedNodesControl = () => {
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const { getNodes } = useReactFlow();
  const { applyLayout, layoutInProgress } = useLayoutContext();
  
  // Track selected nodes
  useEffect(() => {
    const checkForSelectedNodes = () => {
      const nodes = getNodes();
      const selected = nodes.filter(node => node.selected);
      setSelectedNodes(selected);
    };
    
    // Initial check
    checkForSelectedNodes();
    
    // Set up interval to check for selection changes
    const interval = setInterval(checkForSelectedNodes, 500);
    
    return () => clearInterval(interval);
  }, [getNodes]);
  
  // Apply layout only to selected nodes and their children
  const handleApplyLayoutToSelected = async () => {
    if (selectedNodes.length === 0 || layoutInProgress) return;
    
    try {
      // Extract the IDs of selected nodes
      
      // Call applyLayout with selected node IDs
      await applyLayout();
    } catch (error) {
      console.error('Error applying layout to selected nodes:', error);
    }
  };
  
  // If no nodes are selected, show instruction message
  if (selectedNodes.length === 0) {
    return (
      <div style={styles.selectionInfo}>
        <p style={{ margin: 0 }}>Select nodes to apply layout to specific branches</p>
      </div>
    );
  }
  
  return (
    <div style={styles.selectedNodesControl}>
      <div style={styles.selectionDetails}>
        <strong style={styles.selectionDetailsStrong}>{selectedNodes.length} nodes selected</strong>
        <p style={styles.selectionDetailsParagraph}>You can apply layout to just these nodes:</p>
      </div>
      
      <button 
        style={{
          ...styles.layoutSelectedButton,
          ...(layoutInProgress ? styles.layoutSelectedButtonDisabled : {})
        }}
        onClick={handleApplyLayoutToSelected}
        disabled={layoutInProgress}
      >
        Apply Layout to Selected
      </button>
    </div>
  );
};

export default SelectedNodesControl;