import React from "react";
import STLViewer from "./STLViewer";
import IKSolverViewer from "./IKSolverViewer"

const App: React.FC = () => {
  return (
    <div style={{ width: "600px", height: "600px", margin: "0 auto" }}>
      <h2>STL Viewer</h2>
      <IKSolverViewer />
    </div>
  );
};

export default App;
