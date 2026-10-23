import { Fragment, useCallback, useEffect, useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function formatTimestamp(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function normalizeEvent(event, index) {
  return {
    id: String(
      event.eventId || event.auditEventId || event.id || `event-${index}`
    ),
    timestamp: event.timestamp,
    source: event.source || "UNKNOWN",
    target: event.target || "UNKNOWN",
    action: event.action || "UNKNOWN",
    decision: event.decision || "UNKNOWN",
    policy: event.policy || "NOT REPORTED",
    severity: event.severity || "NOT REPORTED",
    requestId: event.requestId || "—",
    reason: event.reason || "No reason provided.",
    previousHash: event.previousHash || "—",
    eventHash: event.eventHash || "—",
  };
}

function AuditLog() {
  const [events, setEvents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await aegisaiApi.auditEvents();

      if (!response || !Array.isArray(response.events)) {
        throw new Error(
          "The backend returned an invalid audit-log response."
        );
      }

      setEvents(response.events.map(normalizeEvent));
      setExpandedId(null);
    } catch (err) {
      setEvents([]);
      setExpandedId(null);
      setError(err.message || "Unable to retrieve audit events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <section
      className="panel audit-panel"
      id="audit-log"
      aria-labelledby="audit-log-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">SECURITY OBSERVABILITY</p>

          <h2 className="section-title" id="audit-log-title">
            Security Audit Log
          </h2>

          <p className="section-description">
            Inspect recorded security decisions and their audit metadata.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={loadEvents}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Events"}
        </button>
      </div>

      <div className="audit-summary">
        <div>
          <span className="eyebrow">RECORDED EVENTS</span>
          <strong>{loading ? "..." : events.length}</strong>
        </div>

        <div>
          <span className="eyebrow">SOURCE</span>
          <strong>Backend Audit Plane</strong>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>Audit log unavailable.</strong> {error}
        </div>
      )}

      {loading && events.length === 0 && !error && (
        <div className="empty-state" role="status">
          <p>Loading audit events from the backend...</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <p>No audit events have been returned by the backend.</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Source</th>
                <th scope="col">Target</th>
                <th scope="col">Action</th>
                <th scope="col">Decision</th>
                <th scope="col">Policy</th>
                <th scope="col">Severity</th>
                <th scope="col">Details</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => {
                const expanded = expandedId === event.id;
                const decision = String(event.decision).toUpperCase();

                const decisionClass =
                  decision === "DENY"
                    ? "audit-deny"
                    : decision === "ALLOW"
                      ? "audit-allow"
                      : "audit-unknown";

                return (
                  <Fragment key={event.id}>
                    <tr>
                      <td>{formatTimestamp(event.timestamp)}</td>
                      <td>{event.source}</td>
                      <td>{event.target}</td>
                      <td>{event.action}</td>

                      <td>
                        <span className={`audit-badge ${decisionClass}`}>
                          {decision}
                        </span>
                      </td>

                      <td className="audit-policy">{event.policy}</td>
                      <td>{event.severity}</td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-small"
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedId(expanded ? null : event.id)
                          }
                        >
                          {expanded ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="audit-detail-row">
                        <td colSpan={8}>
                          <div className="audit-details">
                            <div>
                              <span className="eyebrow">REQUEST ID</span>
                              <code>{event.requestId}</code>
                            </div>

                            <div>
                              <span className="eyebrow">AUDIT EVENT ID</span>
                              <code>{event.id}</code>
                            </div>

                            <div>
                              <span className="eyebrow">REASON</span>
                              <p>{event.reason}</p>
                            </div>

                            <div>
                              <span className="eyebrow">PREVIOUS HASH</span>
                              <code>{event.previousHash}</code>
                            </div>

                            <div>
                              <span className="eyebrow">EVENT HASH</span>
                              <code>{event.eventHash}</code>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="audit-note">
        Events are read from the backend. The frontend does not create or
        fabricate security audit records.
      </p>
    </section>
  );
}

export default AuditLog;
