# React Flow Automated Layout

A React library for automated layout of nested node graphs with parent-child relationships using React Flow. The library provides an easy-to-use context provider system that handles intelligent layouts for flowcharts and diagrams.

## Examples in codesandbox.io
[Link](https://codesandbox.io/p/sandbox/wyp9px)

## Key Features

- **Automated Layout**: Implements Dagre algorithm for automated graph layouts
- **Parent-Child Relationships**: Supports nested nodes with parent-child container relationships
- **Dynamic Resizing**: Automatic parent container resizing based on child nodes
- **Flexible Directions**: Support for both vertical (DOWN) and horizontal (RIGHT) layouts
- **Interactive UI**: Real-time layout adjustments with control panel
- **Selective Layout**: Apply layout to only selected nodes or the entire graph
- **Custom Controls**: Create your own control interfaces using the layout context
- **Auto-reconnection**: Smart edge reconnection when nodes are removed
- **Extensible Engine System**: Designed to support custom layout engines in future releases

## Installation

```bash
npm install @jalez/react-flow-automated-layout
```

## Quick Start

First, set up your React Flow component and then wrap it with the LayoutProvider:

```jsx
import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import { LayoutProvider, LayoutControls } from '@jalez/react-flow-automated-layout';
import '@xyflow/react/dist/style.css';

function FlowDiagram() {
  // Set up React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Maps for parent-child relationships (required by LayoutProvider)
  const [parentIdWithNodes, setParentIdWithNodes] = useState(new Map());
  const [nodeIdWithNode, setNodeIdWithNode] = useState(new Map());
  
  // Update these maps whenever nodes change
  useEffect(() => {
    const parentIdWithNodes = new Map();
    const nodeIdWithNode = new Map();
    
    nodes.forEach((node) => {
      // Store node by ID for quick lookup
      nodeIdWithNode.set(node.id, node);
      
      // Group nodes by their parent ID
      if (node.parentId) {
        if (!parentIdWithNodes.has(node.parentId)) {
          parentIdWithNodes.set(node.parentId, []);
        }
        parentIdWithNodes.get(node.parentId).push(node);
      } else {
        // Store top-level nodes in a special group
        if(!parentIdWithNodes.has("no-parent")) {
          parentIdWithNodes.set("no-parent", []);
        }
        parentIdWithNodes.get("no-parent").push(node);
      }
    });
    
    setParentIdWithNodes(parentIdWithNodes);
    setNodeIdWithNode(nodeIdWithNode);
  }, [nodes]);
  
  // Callbacks to update nodes and edges (required by LayoutProvider)
  const updateNodesHandler = useCallback((newNodes) => {
    setNodes(newNodes);
  }, [setNodes]);
  
  const updateEdgesHandler = useCallback((newEdges) => {
    setEdges(newEdges);
  }, [setEdges]);
  
  return (
    <ReactFlowProvider>
      <LayoutProvider
        initialDirection="DOWN"
        initialAutoLayout={true}
        initialPadding={50}
        initialSpacing={{ node: 50, layer: 50 }}
        initialParentResizingOptions={{
          padding: {
            horizontal: 50,
            vertical: 40,
          },
          minWidth: 150,
          minHeight: 150,
        }}
        updateNodes={updateNodesHandler}
        updateEdges={updateEdgesHandler}
        parentIdWithNodes={parentIdWithNodes}
        nodeIdWithNode={nodeIdWithNode}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          {/* Add LayoutControls to your Controls component */}
          <Controls position="top-right">
            <LayoutControls 
              showDirectionControls={true}
              showAutoLayoutToggle={true}
              showSpacingControls={true}
              showApplyLayoutButton={true}
            />
          </Controls>
          <Background />
        </ReactFlow>
      </LayoutProvider>
    </ReactFlowProvider>
  );
}
```

## Parent-Child Relationships

To create parent-child relationships, set the `parentId` property on child nodes and the `extent` property to 'parent':

```javascript
// Parent node
const parentNode = {
  id: 'parent1',
  type: 'group',
  data: {},
  position: { x: 0, y: 0 },
  style: {
    width: 400,
    height: 400,
    border: '1px solid #000',
  }
};

// Child nodes
const childNodes = [
  {
    id: 'child1',
    data: { label: 'Child 1' },
    position: { x: 0, y: 0 },
    parentId: 'parent1',
    extent: 'parent'
  },
  {
    id: 'child2',
    data: { label: 'Child 2' },
    position: { x: 0, y: 0 },
    parentId: 'parent1',
    extent: 'parent'
  }
];

// Initialize with both parent and child nodes
const initialNodes = [parentNode, ...childNodes];
```

## Making Custom Controls

You can create your own custom controls by using the `useLayoutContext` hook:

```jsx
import { useLayoutContext } from '@jalez/react-flow-automated-layout';

function CustomLayoutControl() {
  const {
    direction,
    autoLayout,
    nodeSpacing,
    layerSpacing,
    layoutInProgress,
    setDirection,
    setAutoLayout,
    setNodeSpacing,
    setLayerSpacing,
    applyLayout
  } = useLayoutContext();
  
  return (
    <div>
      <h3>Custom Layout Controls</h3>
      
      {/* Direction controls */}
      <div>
        <label>Direction:</label>
        <div>
          {(['DOWN', 'RIGHT', 'UP', 'LEFT']).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirection(dir)}
              style={{
                background: direction === dir ? '#0041d0' : '#f5f5f5',
                color: direction === dir ? 'white' : 'black'
              }}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>
      
      {/* Spacing control */}
      <div>
        <label>Spacing: {nodeSpacing}px</label>
        <input
          type="range"
          min="20"
          max="200"
          value={nodeSpacing}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setNodeSpacing(value);
            setLayerSpacing(value);
          }}
        />
      </div>
      
      {/* Auto layout toggle */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={autoLayout}
            onChange={() => setAutoLayout(!autoLayout)}
          />
          Auto Layout
        </label>
      </div>
      
      {/* Apply layout button */}
      {!autoLayout && (
        <button
          onClick={() => applyLayout()}
          disabled={layoutInProgress}
        >
          {layoutInProgress ? 'Applying...' : 'Apply Layout'}
        </button>
      )}
    </div>
  );
}
```

## Technologies Used

- **React**: For building the user interface
- **TypeScript**: For type-safe development
- **@xyflow/react**: Core React Flow library for graph visualization
- **@dagrejs/dagre**: For automated layout calculations

## Core Components

- **LayoutProvider**: Context provider that wraps your React Flow component
- **LayoutControls**: Ready-to-use UI component for adjusting layout settings
- **HierarchicalLayoutOrganizer**: Core layout engine that handles parent-child relationships
- **useLayoutContext**: Hook for accessing layout context in custom components

## Future Plans

- **Custom Layout Engines**: Support for pluggable layout engines beyond the built-in Dagre implementation
- **Advanced Layout Algorithms**: Integration with engines like ELK for more sophisticated layout options

## Examples Included

The github repository includes several examples demonstrating different features:

### 01 - Basic Layout

Demonstrates how LayoutProvider automatically organizes nested nodes with parent-child relationships while maintaining proper spacing and hierarchy.

### 02 - Add Node on Edge Drop

Shows how LayoutProvider automatically reorganizes the diagram when new nodes are created, keeping the layout clean and organized.

### 03 - Remove Node with Reconnection

Illustrates how LayoutProvider maintains a coherent layout when nodes are deleted, automatically rearranging connections and preserving the flow.

### 04 - Select Node

Demonstrates selective layout application where only selected nodes are reorganized while the rest of the graph remains unchanged, allowing targeted layout adjustments to specific parts of complex diagrams.

### 05 - Custom Controls

Shows how to build your own custom UI controls by accessing the layout context directly via the useLayoutContext hook, enabling fully customized layout interfaces.

## API Reference

### LayoutProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | | Child components |
| initialDirection | 'UP' \| 'DOWN' \| 'LEFT' \| 'RIGHT' | 'DOWN' | Initial layout direction |
| initialAutoLayout | boolean | false | Whether to automatically apply layout on changes |
| initialPadding | number | 50 | Padding around the layout |
| initialSpacing | { node: number, layer: number } | { node: 50, layer: 50 } | Spacing between nodes and layers |
| initialParentResizingOptions | object | See below | Options for parent container resizing |
| updateNodes | (nodes: Node[]) => void | | Callback to update nodes |
| updateEdges | (edges: Edge[]) => void | | Callback to update edges |
| parentIdWithNodes | Map<string, Node[]> | | Map of parent IDs to child nodes |
| nodeIdWithNode | Map<string, Node> | | Map of node IDs to node objects |

#### Default Parent Resizing Options

```javascript
{
  padding: {
    horizontal: 50,
    vertical: 40
  },
  minWidth: 150,
  minHeight: 150
}
```

### LayoutControls Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| showDirectionControls | boolean | true | Show direction control buttons |
| showAutoLayoutToggle | boolean | true | Show auto-layout toggle switch |
| showSpacingControls | boolean | true | Show spacing slider controls |
| showApplyLayoutButton | boolean | true | Show apply layout button |

### useLayoutContext Hook

```jsx
import { useLayoutContext } from "@jalez/react-flow-automated-layout";

function MyCustomControl() {
  const { 
    direction, 
    setDirection, 
    nodeSpacing, 
    layerSpacing,
    setNodeSpacing,
    setLayerSpacing,
    applyLayout,
    autoLayout,
    setAutoLayout,
    layoutInProgress
  } = useLayoutContext();
  
  // Your custom control implementation
}
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## License

MIT
