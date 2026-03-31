import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useNodes,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useEffect, useRef } from 'react';

import '@xyflow/react/dist/style.css';

import { LayoutControls, LayoutProvider, useLayoutContext } from '../../LayoutContext';
import { initialEdges, initialNodes } from './initialElements';

const panelStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
  maxWidth: 360,
  padding: 12,
};

const InitialLayout = () => {
  const { applyLayout } = useLayoutContext();
  const nodes = useNodes();
  const hasAppliedRef = useRef(false);

  useEffect(() => {
    if (hasAppliedRef.current || nodes.length === 0) {
      return;
    }

    hasAppliedRef.current = true;
    void applyLayout();
  }, [applyLayout, nodes.length]);

  return null;
};

const CyclicContainersExample = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LayoutProvider
        initialAutoLayout={false}
        disableAutoLayoutEffect={true}
        initialNodeDimensions={{ width: 132, height: 28 }}
      >
        <InitialLayout />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Panel position="top-left" style={panelStyle}>
            <strong>Mixed bridge and normal layout case</strong>
            <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
              Group A contains three nested branches and Group B contains a
              normal node chain. Two bridge patterns, A11 -&gt; B1 -&gt; A21 and
              A12 -&gt; B2 -&gt; A31, sit alongside ordinary in-branch edges plus
              an unrelated normal subtree in Group C.
            </p>
          </Panel>
          <Controls position="top-right">
            <LayoutControls />
          </Controls>
          <Background />
        </ReactFlow>
      </LayoutProvider>
    </div>
  );
};

export default CyclicContainersExample;
