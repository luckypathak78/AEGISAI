import { useState } from "react";
import { aegisaiApi } from "../api/aegisai";

const NORMAL_CONTEXT = JSON.stringify(
  {
    username: "Demo User",
    normalData: "Demo request",
  },
  null,
  2
);

const PROTECTED_CONTEXT = JSON.stringify(
  {
    username: "Demo User",
    requestedResource: "blue-team-secret",
    action: "read_secret",
  },
  null,
  2
);

function LLMSafety() {
  const [context, setContext] = useState(NORMAL_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function loadExample(example) {
    setContext(example);
    setResult(null);
    setError("");
  }

  async function testContext(event) {
    event.preventDefault();

    setResult(null);
    setError("");

    let parsedContext;

    try {
      parsedContext = JSON.parse(context);
    } catch {
      setError("Invalid JSON. Please correct the context before submitting.");
      return;
    }

    if (
      parsedContext === null ||
      typeof parsedContext !== "object" ||
      Array.isArray(parsedContext)
    ) {
      setError("Context must be a valid JSON object.");
      return;
    }

    setLoading(true);

    try {
      // The endpoint is documented in the shared API contract.
      // Confirm the payload and response schema with the backend team.
      const response = await aegisaiApi.sanitizeLLMContext({
        context: parsedContext,
      });

      const security = response?.security || response?.result || response;
      const decision = String(security?.decision || "").toUpperCase();

      if (decision !== "ALLOW" && decision !== "DENY") {
        setResult({
          type: "unknown",
          message:
            "The endpoint responded, but no valid security decision was reported.",
        });
        return;
      }

      setResult({
        type: decision === "DENY" ? "blocked" : "allowed",
        decision,
        policy: security?.policy || "NOT REPORTED",
        reason: security?.reason || "No reason provided by backend.",
      });
    } catch (err) {
      const responseData = err.data;
      const security = responseData?.security || responseData?.result || {};
      const decision = String(
        security?.decision || responseData?.decision || ""
      ).toUpperCase();

      if (err.status === 403 && decision === "DENY") {
        setResult({
          type: "blocked",
          decision: "DENY",
          policy: security?.policy || responseData?.policy || "NOT REPORTED",
          reason:
            security?.reason ||
            responseData?.reason ||
            "The backend explicitly denied the request.",
        });
      } else {
        setError(
          err.message || "The context-security test could not be completed."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel llm-safety-panel"
      id="llm-safety"
      aria-labelledby="llm-safety-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">PROTECTED CONTEXT GATEWAY</p>

          <h2 className="section-title" id="llm-safety-title">
            LLM Context Security
          </h2>

          <p className="section-description">
            Submit sample context for evaluation by the backend Security Core.
          </p>
        </div>
      </div>

      <div className="llm-flow" aria-label="LLM security flow">
        <div className="llm-flow-step">
          <span className="eyebrow">INPUT</span>
          <strong>Context</strong>
        </div>

        <span className="llm-flow-arrow" aria-hidden="true">
          →
        </span>

        <div className="llm-flow-step">
          <span className="eyebrow">EVALUATION</span>
          <strong>Security Core</strong>
        </div>

        <span className="llm-flow-arrow" aria-hidden="true">
          →
        </span>

        <div className="llm-flow-step">
          <span className="eyebrow">DECISION</span>
          <strong>Allow / Deny</strong>
        </div>
      </div>

      <form onSubmit={testContext}>
        <label className="llm-editor-label" htmlFor="llm-context">
          JSON Context
        </label>

        <textarea
          id="llm-context"
          className="llm-context-editor"
          value={context}
          onChange={(event) => {
            setContext(event.target.value);
            setResult(null);
            setError("");
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby="llm-context-help"
          rows={9}
          required
        />

        <p className="llm-editor-help" id="llm-context-help">
          Use sample data only. Never enter real passwords, API keys, or
          production secrets.
        </p>

        <div className="llm-actions">
          <button
            type="button"
            className="btn"
            onClick={() => loadExample(NORMAL_CONTEXT)}
            disabled={loading}
          >
            Load Normal Example
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => loadExample(PROTECTED_CONTEXT)}
            disabled={loading}
          >
            Load Protected Example
          </button>

          <button
            type="submit"
            className="btn llm-submit-button"
            disabled={loading}
          >
            {loading ? "Evaluating..." : "TEST LLM CONTEXT"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="verification-pending" role="status">
          Waiting for the backend Security Core...
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Context test unavailable.</strong> {error}
        </div>
      )}

      {result && (
        <div
          className={`llm-result ${result.type === "blocked"
              ? "llm-result-blocked"
              : result.type === "allowed"
                ? "llm-result-allowed"
                : "llm-result-unknown"
            }`}
          role="status"
          aria-live="polite"
        >
          <p className="eyebrow">BACKEND SECURITY DECISION</p>

          <h3>
            {result.type === "blocked"
              ? "PROTECTED REQUEST DENIED"
              : result.type === "allowed"
                ? "REQUEST ALLOWED"
                : "DECISION UNCONFIRMED"}
          </h3>

          {result.decision && (
            <p>
              <strong>Decision:</strong> {result.decision}
            </p>
          )}

          {result.policy && (
            <p>
              <strong>Policy:</strong> {result.policy}
            </p>
          )}

          {result.reason && (
            <p>
              <strong>Reason:</strong> {result.reason}
            </p>
          )}

          {result.message && <p>{result.message}</p>}

          {result.type === "blocked" && (
            <p className="llm-protection-note">
              The backend explicitly denied the request. Submitted context
              values are not displayed in the result.
            </p>
          )}
        </div>
      )}

      <p className="llm-security-note">
        The backend Security Core is authoritative. This interface does not
        implement its own security policies or reveal protected values.
      </p>
    </section>
  );
}

export default LLMSafety;

