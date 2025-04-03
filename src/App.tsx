
import { ReactFlowProvider } from "@xyflow/react";
import { DagreFlow } from "./Examples/01-Dagre/DagreFlow";
import ParentNodeResizeFlow from "./Examples/Parent-Node-Resize/ParentNodeResizeFlow";
// import "react-grid-layout/css/styles.css";
// import "react-resizable/css/styles.css";
function App() {
  return (

    <ReactFlowProvider>

    <div style={{ width: "100vw", height: "100vh" }}>
      {/* <ParentNodeResizeFlow /> */}
      <DagreFlow />
    </div>
    </ReactFlowProvider>
  );
}

export default App;
