import { useEffect, useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function Header() {
  const [connection, setConnection] = useState("checking");
  const [checking, setChecking] = useState(false);

  async function checkBackend() {
    setChecking(true);

    try {
      const health = await aegisaiApi.health();

      setConnection(health?.ok === true ? "connected" : "unknown");
    } catch {
      setConnection("offline");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkBackend();

    const interval = window.setInterval(checkBackend, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const connectionLabels = {
    checking: "CHECKING CONNECTION",
    connected: "BACKEND CONNECTED",
    offline: "BACKEND OFFLINE",
    unknown: "BACKEND STATUS UNKNOWN",
  };

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          A
        </div>

        <div>
          <h1 className="brand-name">AEGISAI</h1>
          <p className="brand-subtitle">
            AI Governance &amp; Security Control System
          </p>
        </div>
      </div>

      <div className="header-right">
        <div
          className={`connection-indicator connection-${connection}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{connectionLabels[connection]}</span>
        </div>

        <div className="core-indicator">
          <span className="eyebrow">SECURITY CORE</span>
          <span className="core-unknown">
            STATUS UNKNOWN
          </span>
        </div>

        <button
          type="button"
          className="btn header-refresh"
          onClick={checkBackend}
          disabled={checking}
          aria-label="Refresh backend connection status"
        >
          <span aria-hidden="true">{checking ? "…" : "↻"}</span>
          <span>{checking ? "Checking" : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
