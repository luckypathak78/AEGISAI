import { useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function AttackSimulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function simulateAttack() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await aegisaiApi.evaluate({
        source: "red-team",
        target: "blue-team",
        action: "read_secret",
        payload: "controlled test payload",
      });

      const decision = response?.decision;

      if (decision !== "ALLOW" && decision !== "DENY") {
        setError(
          "The backend response did not contain a valid security decision."
        );
        return;
      }

      setResult({
        blocked: decision === "DENY",
        decision,
        policy: response?.policy || "NOT REPORTED",
        severity: response?.severity || "NOT REPORTED",
        reason: response?.reason || "No reason provided by backend.",
        requestId: response?.requestId || null,
        auditEventId: response?.auditEventId || null,
      });
    } catch (err) {
      const security = err.data?.security;
      const decision = err.data?.decision || security?.decision;

      // Treat a failed HTTP request as a denial only if the backend
      // explicitly reports a DENY decision in its response.
      if (err.status === 403 && decision === "DENY") {
        setResult({
          blocked: true,
          decision: "DENY",
          policy: err.data?.policy || security?.policy || "NOT REPORTED",
          severity:
            err.data?.severity || security?.severity || "NOT REPORTED",
          reason:
            err.data?.reason ||
            security?.reason ||
            "Access denied by the backend Security Core.",
          requestId: err.data?.requestId || null,
          auditEventId: err.data?.auditEventId || null,
        });
      } else {
        setError(
          err.message || "The attack simulation could not be completed."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel attack-panel" id="attack-simulator">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CONTROLLED ADVERSARIAL TEST</p>
          <h2 className="section-title">Red Team Attack Simulator</h2>
          <p className="section-description">
            Test whether an unauthorized Red Team request can access a
            protected Blue Team resource.
          </p>
        </div>
      </div>

      <div className="attack-flow">
        <div className="attack-node red-team-node">
          <span className="eyebrow">ATTACKER</span>
          <strong>RED TEAM</strong>
          <span className="mono">read_secret</span>
        </div>

        <div className="attack-connector" aria-hidden="true">
          <span>REQUEST</span>
          <span className="connector-line">──────→</span>
        </div>

        <div className="attack-node security-node">
          <span className="eyebrow">POLICY ENFORCEMENT</span>
          <strong>SECURITY CORE</strong>
          <span className="mono">Policy Gateway</span>
        </div>

        <div className="attack-connector" aria-hidden="true">
          <span>DECISION</span>
          <span className="connector-line">──────→</span>
        </div>

        <div className="attack-node blue-team-node">
          <span className="eyebrow">PROTECTED RESOURCE</span>
          <strong>BLUE TEAM</strong>
          <span className="mono">Secret: [REDACTED]</span>
        </div>
      </div>

      <div className="attack-action">
        <div>
          <span className="status-dot danger" aria-hidden="true" />
          <span>Cross-tenant secret access test</span>
        </div>

        <button
          type="button"
          className="btn btn-danger"
          onClick={simulateAttack}
          disabled={loading}
        >
          {loading ? "Testing…" : "⚡ SIMULATE ATTACK"}
        </button>
      </div>

      {result && (
        <div
          className={
            result.blocked
              ? "attack-result attack-blocked"
              : "attack-result"
          }
          role="status"
          aria-live="polite"
        >
          <div className="attack-result-heading">
            <span className="result-symbol" aria-hidden="true">
              {result.blocked ? "✓" : "!"}
            </span>

            <div>
              <h3>
                {result.blocked
                  ? "ATTACK BLOCKED"
                  : "SECURITY DECISION REPORTED"}
              </h3>
              <p>
                {result.blocked
                  ? "The backend Security Core denied the unauthorized request."
                  : "The backend reported ALLOW. Review the policy decision with your team."}
              </p>
            </div>
          </div>

          <div className="attack-result-grid">
            <div>
              <span className="eyebrow">DECISION</span>
              <strong>{result.decision}</strong>
            </div>

            <div>
              <span className="eyebrow">SEVERITY</span>
              <strong>{result.severity}</strong>
            </div>

            <div className="attack-policy">
              <span className="eyebrow">POLICY</span>
              <strong>{result.policy}</strong>
            </div>
          </div>

          <div className="attack-reason">
            <span className="eyebrow">REASON</span>
            <p>{result.reason}</p>
          </div>

          {(result.requestId || result.auditEventId) && (
            <div className="attack-reason">
              <span className="eyebrow">TRACE INFORMATION</span>
              {result.requestId && (
                <p>
                  Request ID: <span className="mono">{result.requestId}</span>
                </p>
              )}
              {result.auditEventId && (
                <p>
                  Audit Event ID:{" "}
                  <span className="mono">{result.auditEventId}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Simulation unavailable.</strong> {error}
        </div>
      )}

      <p className="attack-disclaimer">
        Security decisions are determined exclusively by the backend. The
        frontend never authorizes requests or reveals protected secrets.
      </p>
    </section>
  );
}

export default AttackSimulator;
