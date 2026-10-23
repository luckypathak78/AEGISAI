import React from "react";
import { createRoot } from "react-dom/client";

import Header from "./components/Header";
import SystemStatus from "./components/SystemStatus";
import AttackSimulator from "./components/AttackSimulator";
import BlueTeamResource from "./components/BlueTeamResource";
import AuditVerification from "./components/AuditVerification";
import AuditLog from "./components/AuditLog";
import LLMSafety from "./components/LLMSafety";
import Metrics from "./components/Metrics";
import "./styles/global.css";

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main>
        <SystemStatus />
        <AttackSimulator />
        <BlueTeamResource />
        <AuditVerification />
        <AuditLog />
        <Metrics />
        <LLMSafety />
      </main>

      <footer className="app-footer">
        <span>AEGISAI</span>
        <span>AI Governance &amp; Security Control System</span>
        <span>Round 2 Prototype</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);