import { ReactFlowProvider } from "@xyflow/react";
import { useState } from "react";
import '@xyflow/react/dist/style.css';

// Import all example components
import BasicFlowLayout from "./Examples/01-Basic/BasicExample";
import AddFlowLayout from "./Examples/02-Add/AddExample";
import RemoveFlowLayout from "./Examples/03-Remove/RemoveExample";
import SelectFlowLayout from "./Examples/04-Select/SelectExample";
import CustomControlsExample from "./Examples/05-Custom-Controls/CustomControlsExample";

// Example type definition
type Example = {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType;
};

// Define available examples
const examples: Example[] = [
  {
    id: "01-basic",
    name: "01 - Basic layout",
    description: "Demonstrates how LayoutProvider automatically organizes nested nodes with parent-child relationships while maintaining proper spacing and hierarchy.",
    component: BasicFlowLayout,
  },
  {
    id: "02-add",
    name: "02 - Add Node on Edge Drop",
    description: "Shows how LayoutProvider automatically reorganizes the diagram when new nodes are created, keeping the layout clean and organized.",
    component: AddFlowLayout,
  },
  {
    id: "03-remove",
    name: "03 - Remove Node with Reconnection",
    description: "Illustrates how LayoutProvider maintains a coherent layout when nodes are deleted, automatically rearranging connections and preserving the flow.",
    component: RemoveFlowLayout,
  },
  {
    id: "04-select",
    name: "04 - Select Node",
    description: "Demonstrates selective layout application where only selected nodes are reorganized while the rest of the graph remains unchanged, allowing targeted layout adjustments to specific parts of complex diagrams.",
    component: SelectFlowLayout,
  },
  {
    id: "05-custom-controls",
    name: "05 - Custom Controls",
    description: "Shows how to build your own custom UI controls by accessing the layout context directly via the useLayoutContext hook, enabling fully customized layout interfaces.",
    component: CustomControlsExample,
  },
];

// Inline styles using React Flow color scheme and patterns
const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1a1a1a',
    background: '#f8f8fa'
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #eaeaea',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: '0 0 1rem 0',
    color: '#1a1a1a'
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  tabButton: {
    padding: '0.6rem 1rem',
    border: 'none',
    borderRadius: '4px',
    background: '#f0f0f4',
    color: '#565656',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeTabButton: {
    background: '#ff6b6b',
    color: 'white'
  },
  description: {
    fontSize: '0.95rem',
    color: '#6e6e6e',
    lineHeight: 1.5
  },
  exampleContainer: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden'
  },
  reactflowWrapper: {
    width: '100%',
    height: '100%'
  }
};

function App() {
  // State to track the selected example
  const [selectedExampleId, setSelectedExampleId] = useState<string>(examples[0].id);
  
  // Get the selected example component
  const selectedExample = examples.find(ex => ex.id === selectedExampleId) || examples[0];
  const ExampleComponent = selectedExample.component;
  
  return (
    <div style={styles.appContainer}>
      {/* Navigation header */}
      <header style={styles.header}>
        <h1 style={styles.title}>React Flow Automated Layout</h1>
        <div style={styles.tabs}>
          {examples.map(example => (
            <button 
              key={example.id}
              style={{
                ...styles.tabButton,
                ...(selectedExampleId === example.id ? styles.activeTabButton : {})
              }}
              onClick={() => setSelectedExampleId(example.id)}
            >
              {example.name}
            </button>
          ))}
        </div>
        <div style={styles.description}>
          <p>{selectedExample.description}</p>
        </div>
      </header>

      {/* Example component area */}
      <div style={styles.exampleContainer}>
        <ReactFlowProvider>
          <div style={styles.reactflowWrapper}>
            <ExampleComponent />
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;
