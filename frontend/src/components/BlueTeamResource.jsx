import { useState } from "react";
import { aegisaiApi } from "../api/aegisai";

function BlueTeamResource() {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");

  async function checkProtection() {
    setLoading(true);
    setDecision(null);
    setError("");

    try {
      const response = await aegisaiApi.evaluate({
        source: "red-team",
        target: "blue-team",
        action: "read_secret",
        payload: "controlled test payload",
      });

      const backendDecision = response?.decision;

      if (backendDecision !== "ALLOW" && backendDecision !== "DENY") {
        setError(
          "The backend did not return a verifiable security decision."
        );
        return;
      }

      setDecision({
        value: backendDecision,
        policy: response?.policy || "NOT REPORTED",
        reason: response?.reason || "No reason provided by backend.",
      });
    } catch (err) {
      const security = err.data?.security;
      const backendDecision = err.data?.decision || security?.decision;

      if (err.status === 403 && backendDecision === "DENY") {
        setDecision({
          value: "DENY",
          policy: err.data?.policy || security?.policy || "NOT REPORTED",
          reason:
            err.data?.reason ||
            security?.reason ||
            "The backend explicitly denied the request.",
        });
      } else {
        setError(
          err.message || "The protection check could not be completed."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel resource-panel" id="blue-team-resource">
      <div className="resource-heading">
        <div className="resource-icon" aria-hidden="true">
          ◈
        </div>

        <div>
          <p className="eyebrow">PROTECTED ASSET</p>
          <h2 className="panel-title">Blue Team Resource</h2>
        </div>
      </div>

      <p className="section-description">
        A resource owned by the Blue Team. Its actual secret value must never
        be exposed in the dashboard.
      </p>

      <div className="resource-details">
        <div className="resource-row">
          <span>Secret value</span>
          <strong className="resource-redacted">[REDACTED]</strong>
        </div>

        <div className="resource-row">
          <span>Access boundary</span>
          <strong>BLUE TEAM</strong>
        </div>

        <div className="resource-row">
          <span>Protection decision</span>
          <strong>
            {loading
              ? "CHECKING..."
              : decision
                ? decision.value
                : "NOT VERIFIED"}
          </strong>
        </div>

        <div className="resource-row">
          <span>Policy</span>
          <strong>{decision?.policy || "NOT REPORTED"}</strong>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-danger"
        onClick={checkProtection}
        disabled={loading}
      >
        {loading ? "Checking..." : "VERIFY ACCESS PROTECTION"}
      </button>

      {decision && (
        <div
          className="attack-reason"
          role="status"
          aria-live="polite"
        >
          <span className="eyebrow">BACKEND RESPONSE</span>
          <p>{decision.reason}</p>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Verification unavailable.</strong> {error}
        </div>
      )}

      <p className="resource-note">
        This check evaluates an access request through the backend policy
        gateway. It does not retrieve or display the protected secret.
      </p>
    </section>
  );
}

export default BlueTeamResource;
