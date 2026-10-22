import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{fontFamily:'system-ui', padding:'40px'}}>
      <h1>AEGISAI</h1>
      <p>Policy-Driven AI Security Evaluation Sandbox</p>
      <p>Round-2 foundation is ready. The frontend owner can now build the dashboard against contracts/API_CONTRACT.md.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
