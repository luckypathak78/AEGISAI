import { useState } from "react";
import { aegisaiApi } from "../api/aegisai";

export default function TinyFishInvestigation() {
  const [url, setUrl] = useState("https://example.com");
  const [goal, setGoal] = useState(
    "Find the title of this webpage and return it."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleInvestigation(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await aegisaiApi.tinyfishInvestigate({
        url,
        goal,
      });

      setResult(data);

      if (data.decision === "DENY") {
        setError(data.reason || "The Security Core denied this request.");
      }
    } catch (err) {
      setError(err.message || "TinyFish investigation failed.");
    } finally {
      setLoading(false);
    }
  }

  const allowed = result?.decision === "ALLOW";
  const denied = result?.decision === "DENY";

  return (
    <section className="panel tinyfish-panel">

      {/* HEADER */}
      <div className="tinyfish-header">
        <div>
          <span className="eyebrow">SECURITY-AWARE WEB AGENT</span>

          <div className="tinyfish-title-row">
            <div className="tinyfish-icon">🐟</div>
            <div>
              <h2>TinyFish Investigation</h2>
              <p>
                Controlled external web investigation through the
                AEGISAI Security Core.
              </p>
            </div>
          </div>
        </div>

        <div className="tinyfish-status">
          <span className="status-dot" />
          TINYFISH
        </div>
      </div>

      {/* SECURITY FLOW */}
      <div className="tinyfish-flow">
        <div className="flow-node">
          <span className="flow-label">REQUEST</span>
          <strong>CLIENT</strong>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node flow-core">
          <span className="flow-label">POLICY GATE</span>
          <strong>SECURITY CORE</strong>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node">
          <span className="flow-label">WEB AGENT</span>
          <strong>TINYFISH</strong>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-node">
          <span className="flow-label">RECORD</span>
          <strong>AUDIT</strong>
        </div>
      </div>

      {/* FORM */}
      <form className="tinyfish-form" onSubmit={handleInvestigation}>

        <div className="tinyfish-field">
          <label htmlFor="tinyfish-url">
            TARGET URL
          </label>

          <input
            id="tinyfish-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="tinyfish-field">
          <label htmlFor="tinyfish-goal">
            INVESTIGATION GOAL
          </label>

          <textarea
            id="tinyfish-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Describe what TinyFish should investigate..."
            rows={3}
            required
          />
        </div>

        <div className="tinyfish-action-row">
          <button
            className="tinyfish-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="tinyfish-spinner" />
                RUNNING INVESTIGATION
              </>
            ) : (
              <>🐟 RUN TINYFISH INVESTIGATION</>
            )}
          </button>

          <span className="tinyfish-security-note">
            BACKEND AUTHORIZATION REQUIRED
          </span>
        </div>
      </form>

      {/* ERROR / DENIAL */}
      {error && (
        <div className="tinyfish-denied">
          <div className="result-status denied">
            <span>●</span>
            ACCESS DENIED
          </div>

          <div className="tinyfish-denied-content">
            <strong>{result?.policy || "SECURITY POLICY"}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* SUCCESS RESULT */}
      {allowed && (
        <div className="tinyfish-result">

          <div className="result-header">
            <div>
              <span className="eyebrow">BACKEND SECURITY DECISION</span>
              <h3>Investigation Authorized</h3>
            </div>

            <div className="result-status allowed">
              <span>●</span>
              ALLOW
            </div>
          </div>

          <div className="result-grid">

            <div className="result-card">
              <span>POLICY</span>
              <strong>{result.policy}</strong>
            </div>

            <div className="result-card">
              <span>SEVERITY</span>
              <strong>{result.severity}</strong>
            </div>

            <div className="result-card">
              <span>STATUS</span>
              <strong>
                {result.result?.status || "COMPLETED"}
              </strong>
            </div>

            <div className="result-card">
              <span>TINYFISH RUN ID</span>
              <strong className="mono">
                {result.result?.run_id || "N/A"}
              </strong>
            </div>

          </div>

          {result.result?.result?.result && (
            <div className="investigation-output">
              <div className="output-header">
                <span>INVESTIGATION RESULT</span>
                <span className="output-live">
                  ● BACKEND REPORTED
                </span>
              </div>

              <div className="output-content">
                {result.result.result.result}
              </div>
            </div>
          )}

          {result.auditEventId && (
            <div className="audit-reference">
              <span>AUDIT EVENT</span>
              <strong className="mono">
                {result.auditEventId}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="tinyfish-footer">
        <span>
          SECURITY CORE → AUTHORIZATION → TINYFISH → AUDIT
        </span>

        <span>
          External execution is never authorized by the frontend.
        </span>
      </div>

    </section>
  );
}