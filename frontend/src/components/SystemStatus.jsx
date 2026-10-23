import { useCallback, useEffect, useState } from "react";
import { aegisaiApi } from "../api/aegisai";

const STATUS_ITEMS = [
{ key: "policyGateway", label: "Policy Gateway" },
{ key: "auditPlane", label: "Audit Plane" },
{ key: "auditIntegrity", label: "Audit Integrity" },
{ key: "clientLLM", label: "Client LLM" },
{ key: "redTeam", label: "Red Team" },
{ key: "blueTeam", label: "Blue Team" },
];

function getStatusTone(value) {
if (typeof value !== "string") return "unknown";

const normalized = value.toUpperCase();

if (["ACTIVE", "READY", "VERIFIED", "ISOLATED", "HEALTHY"].includes(normalized)) {
return "healthy";
}

if (["DENIED", "BLOCKED", "FAILED", "OFFLINE", "ERROR"].includes(normalized)) {
return "danger";
}

if (["WARNING", "DEGRADED", "PENDING"].includes(normalized)) {
return "warning";
}

return "unknown";
}

function SystemStatus() {
const [status, setStatus] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const loadStatus = useCallback(async () => {
setLoading(true);
setError("");

try {
  const result = await aegisaiApi.systemStatus();

  if (!result || typeof result !== "object") {
    throw new Error("The backend returned an invalid system status.");
  }

  setStatus(result);
} catch (err) {
  setError(err.message || "Unable to load system status.");
  setStatus(null);
} finally {
  setLoading(false);
}

}, []);

useEffect(() => {
loadStatus();

const interval = window.setInterval(loadStatus, 30000);

return () => window.clearInterval(interval);

}, [loadStatus]);

return (
<section className="status-section" id="system-status" aria-labelledby="system-status-title">
<div className="section-heading">
<div>
<p className="eyebrow">SYSTEM OVERVIEW</p>
<h2 className="section-title" id="system-status-title">
System Status
</h2>
<p className="section-description">
Live status reported by the AEGISAI backend.
</p>
</div>

    <button
      type="button"
      className="btn"
      onClick={loadStatus}
      disabled={loading}
    >
      {loading ? "Refreshing…" : "↻ Refresh Status"}
    </button>
  </div>

  {error && (
    <div className="error-message" role="alert">
      <strong>Status unavailable.</strong> {error}
    </div>
  )}

  {loading && !status ? (
    <div className="status-grid" aria-label="Loading system status">
      {STATUS_ITEMS.map((item) => (
        <div className="status-card status-card-loading" key={item.key}>
          <span className="skeleton-line" />
          <span className="skeleton-value" />
          <span className="muted">Loading status…</span>
        </div>
      ))}
    </div>
  ) : status ? (
    <>
      <div className="system-identity">
        <span className="eyebrow">SYSTEM</span>
        <span className="mono">{status.system || "AEGISAI"}</span>
      </div>

      <div className="status-grid">
        {STATUS_ITEMS.map((item) => {
          const value = status[item.key];
          const tone = getStatusTone(value);

          return (
            <article className="status-card" key={item.key}>
              <div className="status-card-top">
                <span className="status-card-label">{item.label}</span>
                <span
                  className={`status-dot ${tone === "healthy" ? "healthy" : tone === "danger" ? "danger" : tone === "warning" ? "warning" : "neutral"}`}
                  aria-hidden="true"
                />
              </div>

              <p className={`status-value status-value-${tone}`}>
                {typeof value === "string" ? value : "UNKNOWN"}
              </p>

              <span className="status-card-caption">
                {tone === "healthy"
                  ? "Reported by backend"
                  : tone === "danger"
                    ? "Requires attention"
                    : tone === "warning"
                      ? "Check system"
                      : "Status not reported"}
              </span>
            </article>
          );
        })}
      </div>
    </>
  ) : (
    !loading && (
      <div className="empty-state">
        <span className="status-dot danger" aria-hidden="true" />
        <p>System status could not be retrieved.</p>
        <button type="button" className="btn" onClick={loadStatus}>
          Try Again
        </button>
      </div>
    )
  )}
</section>

);
}
export default SystemStatus;