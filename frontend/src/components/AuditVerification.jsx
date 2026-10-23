import { useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function AuditVerification() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function verifyAudit() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await aegisaiApi.verifyAuditIntegrity();

      if (
        !response ||
        typeof response.verified !== "boolean"
      ) {
        throw new Error(
          "The backend response does not match the audit verification API contract."
        );
      }

      setResult({
        verified: response.verified,
        eventsChecked:
          typeof response.eventsChecked === "number"
            ? response.eventsChecked
            : null,
        message:
          typeof response.message === "string"
            ? response.message
            : "The backend returned an audit verification result.",
      });
    } catch (err) {
      setError(
        err.message ||
          "Audit integrity verification could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel verification-panel"
      id="audit-verification"
      aria-labelledby="verification-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">TAMPER DETECTION</p>

          <h2 className="section-title" id="verification-title">
            Audit Integrity Verification
          </h2>

          <p className="section-description">
            Ask the backend to verify the integrity of the recorded audit chain.
          </p>
        </div>
      </div>

      <div className="verification-content">
        <div className="verification-icon" aria-hidden="true">
          ⛓
        </div>

        <div className="verification-description">
          <h3>Audit Chain</h3>
          <p>
            Verify whether the recorded security events pass the backend's
            integrity checks.
          </p>
        </div>

        <button
          type="button"
          className="btn verification-button"
          onClick={verifyAudit}
          disabled={loading}
        >
          {loading ? "Verifying..." : "VERIFY AUDIT INTEGRITY"}
        </button>
      </div>

      {loading && (
        <div className="verification-pending" role="status">
          Requesting audit verification from the backend...
        </div>
      )}

      {result && (
        <div
          className={`verification-result ${
            result.verified
              ? "verification-success"
              : "verification-failure"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="verification-result-heading">
            <span aria-hidden="true">
              {result.verified ? "✓" : "!"}
            </span>

            <div>
              <h3>
                {result.verified
                  ? "AUDIT CHAIN VERIFIED"
                  : "AUDIT CHAIN INTEGRITY FAILURE"}
              </h3>

              <p>{result.message}</p>
            </div>
          </div>

          <div className="verification-metadata">
            <span>Events checked</span>

            <strong>
              {result.eventsChecked !== null
                ? result.eventsChecked
                : "NOT REPORTED"}
            </strong>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Verification unavailable.</strong> {error}
        </div>
      )}

      <p className="verification-note">
        Verification results are reported by the backend. The frontend does
        not calculate or assume audit-chain integrity.
      </p>
    </section>
  );
}

export default AuditVerification;

