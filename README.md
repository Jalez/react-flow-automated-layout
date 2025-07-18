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
- **Parent Inclusion Fix**: Automatically includes a selected child’s parent node to ensure accurate automated layouts when only child nodes are selected
- **Custom Controls**: Create your own control interfaces using the layout context
- **Auto-reconnection**: Smart edge reconnection when nodes are removed
- **Configurable Node Dimensions**: Set default dimensions for nodes that don't have explicit width/height
- **Extensible Engine System**: Designed to support custom layout engines in future releases

## Breaking Changes in 1.0.0

Version 1.0.0 introduces one breaking change that require updates to your code:

### 1. Parent-Child Relationship Maps

The most significant change is how parent-child relationships are managed:

**Old API (v0.x):**
```javascript
// Map of parent IDs to arrays of child nodes
const parentIdWithNodes = new Map<string, Node[]>();

// Update on node changes
nodes.forEach((node) => {
  if (node.parentId) {
    if (!parentIdWithNodes.has(node.parentId)) {
      parentIdWithNodes.set(node.parentId, []);
    }
    parentIdWithNodes.get(node.parentId).push(node);
  } else {
    if(!parentIdWithNodes.has("no-parent")) {
      parentIdWithNodes.set("no-parent", []);
    }
    parentIdWithNodes.get("no-parent").push(node);
  }
});
```

**New API (v1.0.0):**
```javascript
// Map of parent IDs to Sets of child IDs (more efficient lookup)
const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
const nodeIdWithNode = new Map<string, Node>();

// Update on node changes
nodes.forEach((node) => {
  // Map for direct node lookup by ID
  nodeIdWithNode.set(node.id, node);
  
  // Map parent ID to Set of child IDs
  const parentId = node.parentId || "no-parent";
  if (!nodeParentIdMapWithChildIdSet.has(parentId)) {
    nodeParentIdMapWithChildIdSet.set(parentId, new Set());
  }
  nodeParentIdMapWithChildIdSet.get(parentId)?.add(node.id);
});
```

### 2. LayoutProvider Props

The LayoutProvider component props have changed accordingly:

**Old API (v0.x):**
```jsx
<LayoutProvider
  // ...other props
  parentIdWithNodes={parentIdWithNodes}
  nodeIdWithNode={nodeIdWithNode}
>
```

**New API (v1.0.0):**
```jsx
<LayoutProvider
//All props now optional!
>
```

## Patch Updates

### 1.2.3 (2025-05-26)

- **Enhanced Edge Handling**: Completely redesigned edge processing system for better reliability with complex nested structures
- **Simplified Layout Pipeline**: Streamlined layout process with pre-computed temporary edge maps
- **Improved LCA Calculations**: Enhanced Lowest Common Ancestor detection for more accurate edge routing
- **Edge Loss Prevention**: Fixed critical edge loss issues in complex hierarchical structures
- **Root-Level Processing**: Added proper root-level edge processing for unresolved edges
- **Performance Optimizations**: Reduced complexity in edge processing with upfront calculations

### 1.2.1 (2025-05-22)

- Added a new `disableAutoLayoutEffect` prop to `LayoutProvider`. This allows you to explicitly disable the automatic layout effect, giving you more control over when layouts are triggered.
- Improved the auto layout effect logic: layout will not run if `disableAutoLayoutEffect` is true or if a layout is already in progress, preventing unwanted or redundant layout runs.
- Enhanced the node discrepancy check: the layout effect now checks if the nodes in the context and the flow are in sync, and skips recalculation if not, reducing unnecessary layout operations.
- Added a console log to indicate when the auto layout effect is triggered (for easier debugging and development).

### 1.1.1 (Unreleased)

- Improved node count discrepancy check to prevent unnecessary layout recalculations when the flow is not in sync with the context.
- Fixed edge mutation issue in getEdgesOfNodes function.
- Removed leftover console logs and old files.
- Minor code style improvements and refactoring.

### 1.1.0 (2025-05-07)

- **Layout Engine System**: Implemented a new pluggable layout engine architecture to support multiple layout algorithms
- **Dagre Engine Adapter**: Converted existing Dagre implementation to use the new engine interface
- **Enhanced Configuration**: Added more flexible configuration options for layout engines
- **Improved Type Safety**: Better TypeScript type definitions for layout configuration
- **Smart Edge Routing**: Enhanced edge handling for connections between non-sibling nodes, automatically routing edges to appropriate parent containers
- **Per-Container Layout Direction**: Support for individual layout directions per container using `data.layoutDirection` property on parent nodes
- **Parallel Layout Processing**: Improved performance with asynchronous parallel processing of layouts

### 1.0.0 (2025-05-02)

- **Optional Relationship Maps**: Made `nodeIdWithNode` and `nodeParentIdMapWithChildIdSet` optional in `LayoutProvider`. When not provided, these maps are now managed internally.
- **Simplified Usage**: Users no longer need to manually manage relationship maps if they don't need custom control over them.

### 0.3.3 (2025-04-21)

- **Selection Handling**: Enhanced parent node filtering with improved handling of node selections
- **Layout Engine**: Improved layout calculation with better support for node dimensions and spacing


### 0.3.2 (2025-04-20)

- **Selection Handling**: Refactored to use Node objects directly, improving type safety and reducing object lookups
- **Parent Node Dimensions**: Added measured property for more accurate parent node dimension tracking
- **Layout Engine**: Enhanced parent node handling in recursive layouts with better dimension updates and parent-child relationships
- **Performance**: Improved node/edge merging performance using Map-based lookups

### 0.3.1 (2025-04-18)

- **Parent Inclusion Fix**: Automatically include a selected child’s parent node to ensure accurate automated layouts when only child nodes are selected


## Installation

```bash
npm install @jalez/react-flow-automated-layout
```

## Quick Start

First, set up your React Flow component and then wrap it with the LayoutProvider:

### Simple Setup (v1.0.0+)

```jsx
import { useState, useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import { LayoutProvider, LayoutControls } from '@jalez/react-flow-automated-layout';
import '@xyflow/react/dist/style.css';

function FlowDiagram() {
  // Set up React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  return (
    <ReactFlowProvider>
      <LayoutProvider>
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

### Manual Control Setup (All versions)

For cases where you need custom control over relationship maps:

```jsx
import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import { LayoutProvider, LayoutControls } from '@jalez/react-flow-automated-layout';
import '@xyflow/react/dist/style.css';

function FlowDiagram() {
  // Set up React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Define a custom key for parentless nodes
  const rootLevelKey = "root-level";
  
  // Maps for parent-child relationships (required by LayoutProvider)
  const [nodeParentIdMapWithChildIdSet, setNodeParentIdMapWithChildIdSet] = useState(new Map());
  const [nodeIdWithNode, setNodeIdWithNode] = useState(new Map());
  
  // Update these maps whenever nodes change
  useEffect(() => {
    const nodeParentIdMapWithChildIdSet = new Map();
    const nodeIdWithNode = new Map();
    
    nodes.forEach((node) => {
      // Store node by ID for quick lookup
      nodeIdWithNode.set(node.id, node);
      
      // Map parent ID to Set of child IDs, using our custom rootLevelKey for parentless nodes
      const parentId = node.parentId || rootLevelKey; 
      if (!nodeParentIdMapWithChildIdSet.has(parentId)) {
        nodeParentIdMapWithChildIdSet.set(parentId, new Set());
      }
      nodeParentIdMapWithChildIdSet.get(parentId).add(node.id);
    });
    
    setNodeParentIdMapWithChildIdSet(nodeParentIdMapWithChildIdSet);
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
        nodeParentIdMapWithChildIdSet={nodeParentIdMapWithChildIdSet}
        nodeIdWithNode={nodeIdWithNode}
        noParentKey={rootLevelKey} // Pass the same custom key for consistency
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

## Node Dimensions

The layout system uses default node dimensions for calculating optimal positioning when nodes don't have explicit width and height values. This is an important feature to understand:

### Default Node Dimensions and Style Priority

When the layout algorithm organizes your nodes, it needs to know how much space each node requires. The library handles this in the following priority order:

1. If a node has explicit dimensions in its `style` property (`style.width` and `style.height`), these values are respected and used for layout calculations
2. If no `style` dimensions are present, the library applies the default dimensions

```javascript
// Default dimensions used internally if not specified on the node's style
const DEFAULT_NODE_WIDTH = 172;
const DEFAULT_NODE_HEIGHT = 36;
```

**Important:** For the layout to work correctly, the system relies on the width and height properties of your nodes. The layout engine will use these values when positioning nodes, so it's crucial that:

1. Either set width and height explicitly in your node's style properties
2. Or let the layout system apply the default dimensions 

This prioritization ensures that your custom node sizes are always respected while still allowing the layout algorithm to make accurate spacing calculations for nodes without explicit dimensions.

### Configuring Default Dimensions

You can customize these defaults when initializing the LayoutProvider:

```jsx
<LayoutProvider
  // Other props...
  initialNodeDimensions={{
    width: 200,   // Custom default width
    height: 50    // Custom default height
  }}
>
  {/* Your React Flow component */}
</LayoutProvider>
```

### Runtime Adjustment

You can adjust node dimensions at runtime using the layout context:

```jsx
const { setNodeWidth, setNodeHeight } = useLayoutContext();

// Update dimensions
setNodeWidth(180);
setNodeHeight(40);
```

### Important: Dimensions in Result Nodes

**When the layout algorithm returns updated nodes, it includes these default dimensions in the nodes' properties.** This means:

1. Nodes without dimensions will have `width` and `height` properties added
2. These properties will be reflected in the rendered nodes
3. The layout calculations will be consistent with the visual representation

This is critical to understand because you should use these dimensions when working with the nodes returned by the layout system, rather than assuming nodes have their original dimensions.

Example of a node after layout:

```javascript
// Original node (no dimensions)
const originalNode = {
  id: 'node1',
  data: { label: 'Node 1' },
  position: { x: 0, y: 0 }
};

// Node after layout (with dimensions added)
const afterLayoutNode = {
  id: 'node1',
  data: { label: 'Node 1' },
  position: { x: 100, y: 200 },
  width: 172,       // Added by the layout system
  height: 36,       // Added by the layout system
  style: {
    width: 172,     // Also added to style
    height: 36      // Also added to style
  }
};
```

This ensures that node dimensions are consistent across the entire application, leading to more predictable layouts.

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
- **LayoutEngine**: Interface for creating custom layout engines (new in v1.1.0)

## Layout Engine System

Starting with v1.1.0, the library implements a pluggable layout engine architecture that allows for different layout algorithms to be used. Currently, the library ships with the Dagre engine:

```jsx
import { LayoutProvider, engines } from '@jalez/react-flow-automated-layout';

function FlowDiagram() {
  return (
    <LayoutProvider
      // Optionally specify a different engine (dagre is the default)
      engine={engines.dagre}
    >
      {/* Your React Flow component */}
    </LayoutProvider>
  );
}
```

### Per-Container Layout Direction (v1.1.0+)

You can now set different layout directions for individual containers by adding a `layoutDirection` property to the parent node's data object:

```jsx
// Parent nodes with different layout directions
const parentNodes = [
  {
    id: 'container1',
    type: 'group',
    data: { 
      label: 'Vertical Layout',
      layoutDirection: 'TB' // Top to Bottom layout for this container's children
    },
    position: { x: 0, y: 0 },
    style: { width: 400, height: 400 }
  },
  {
    id: 'container2',
    type: 'group',
    data: { 
      label: 'Horizontal Layout',
      layoutDirection: 'LR' // Left to Right layout for this container's children
    },
    position: { x: 500, y: 0 },
    style: { width: 400, height: 400 }
  }
];
```

This allows you to create more complex diagrams with different layout directions per section, all while maintaining the global layout algorithm for parent relationships.

### Smart Edge Routing (v1.1.0+)

The new edge handling system automatically manages connections between nodes in different containers, rerouting edges to the appropriate parent containers when necessary. This works automatically when you create edges between nodes that aren't direct siblings:

```jsx
// Example edge between nodes in different containers
const crossContainerEdge = {
  id: 'edge-cross-container',
  source: 'node-in-container1',
  target: 'node-in-container2'
};
```

When this edge is processed by the layout engine, it will intelligently:

1. Detect that source and target are in different containers
2. Temporarily reroute the edge between the appropriate parent containers for layout calculations
3. Preserve the original edge connectivity in the final rendered graph

This leads to cleaner diagrams with more logical edge paths, especially in complex nested structures.

### Creating Custom Layout Engines

You can implement your own layout engine by implementing the LayoutEngine interface:

```typescript
import { LayoutEngine } from '@jalez/react-flow-automated-layout';

const MyCustomEngine: LayoutEngine = {
  calculate: async (nodes, edges, options) => {
    // Your custom layout algorithm implementation
    // Must return positioned nodes with { position: { x, y } }
    return layoutedNodes;
  }
};

// Then use your engine in the LayoutProvider
<LayoutProvider engine={MyCustomEngine}>
  {/* Your React Flow component */}
</LayoutProvider>
```

### Layout Configuration

The layout engine system provides flexible configuration options:

```typescript
// Example of configuration options for layout engines
const layoutConfig = {
  nodes: nodes,
  edges: edges,
  dagreDirection: 'TB', // 'TB', 'BT', 'LR', or 'RL'
  margin: 20,
  nodeSpacing: 50,
  layerSpacing: 50,
  nodeWidth: 172,
  nodeHeight: 36,
  layoutHidden: false // Whether to include hidden nodes in layout
};

// Access configuration through the context
const { setLayoutConfig } = useLayoutContext();
setLayoutConfig(layoutConfig);
```

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
| initialNodeDimensions | { width: number, height: number } | { width: 172, height: 36 } | Default dimensions for nodes without explicit width/height |
| initialParentResizingOptions | object | See below | Options for parent container resizing |
| updateNodes | (nodes: Node[]) => void | | Callback to update nodes |
| updateEdges | (edges: Edge[]) => void | | Callback to update edges |
| nodeParentIdMapWithChildIdSet | Map<string, Set<string>> | | Map of parent IDs to Sets of child IDs. Must include a key grouping top-level nodes without a parent. |
| nodeIdWithNode | Map<string, Node> | | Map of node IDs to node objects |
| noParentKey | string | 'no-parent' | Customizable key used to represent nodes without a parent in the nodeParentIdMapWithChildIdSet map |

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
