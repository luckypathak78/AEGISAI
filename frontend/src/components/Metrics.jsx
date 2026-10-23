import { useCallback, useEffect, useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function Metrics() {
const [metrics, setMetrics] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const loadMetrics = useCallback(async () => {
setLoading(true);
setError("");
try {
  const response = await aegisaiApi.metrics();
  const data = response?.metrics;

  if (!data || typeof data !== "object") {
    throw new Error("The backend did not return valid metrics.");
  }

  setMetrics(data);
} catch (err) {
  setMetrics(null);
  setError(err.message || "Unable to load security metrics.");
} finally {
  setLoading(false);
}

}, []);

useEffect(() => {
loadMetrics();
}, [loadMetrics]);

const cards = [
{
label: "Total Security Decisions",
value: metrics?.totalSecurityDecisions,
},
{
label: "Allowed Decisions",
value: metrics?.allowedDecisions,
},
{
label: "Denied Decisions",
value: metrics?.deniedDecisions,
},
{
label: "Audit Events",
value: metrics?.auditEvents,
},
];

return ( <section className="panel" id="metrics" aria-labelledby="metrics-title"> <div className="section-heading"> <div> <p className="eyebrow">SECURITY TELEMETRY</p> <h2 className="section-title" id="metrics-title">
Security Metrics </h2> <p className="section-description">
Decision counts and audit totals reported by the backend. </p> </div>
    <button
      type="button"
      className="btn"
      onClick={loadMetrics}
      disabled={loading}
    >
      {loading ? "Loading..." : "Refresh Metrics"}
    </button>
  </div>

  {loading && (
    <p className="verification-pending" role="status">
      Loading metrics from the backend...
    </p>
  )}

  {error && (
    <p className="error-message" role="alert">
      Unable to load metrics: {error}
    </p>
  )}

  {!loading && !error && metrics && (
    <div className="status-grid">
      {cards.map((card) => (
        <article className="status-card" key={card.label}>
          <h3>{card.label}</h3>
          <p className="status-value">
            {typeof card.value === "number" ? card.value : "NOT REPORTED"}
          </p>
          <p className="status-detail">Reported by backend</p>
        </article>
      ))}
    </div>
  )}
</section>
);
}

export default Metrics;
