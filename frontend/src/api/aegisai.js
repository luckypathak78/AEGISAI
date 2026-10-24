const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 30000;

async function request(path, options = {}) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    let data;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        response.status === 403
          ? "The backend denied this request."
          : response.status === 400
            ? "The request was invalid."
            : response.status === 404
              ? "This API endpoint is not available yet."
              : response.status >= 500
                ? "The backend encountered an error."
                : "The request could not be completed."
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    if (data === null) {
      const error = new Error(
        "The backend returned an invalid response."
      );

      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The backend request timed out. Please try again."
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to the backend. Check that it is running and accessible."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const aegisaiApi = {
  health() {
    return request("/api/health");
  },

  systemStatus() {
    return request("/api/system/status");
  },

  policies() {
    return request("/api/policies");
  },

  evaluate(payload) {
    return request("/api/evaluate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  securityTest(payload) {
    return request("/api/security/test", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  runDemo() {
    return request("/api/demo/run", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  auditEvents() {
    return request("/api/audit/events");
  },

  verifyAuditIntegrity() {
    return request("/api/audit/verify");
  },

  metrics() {
    return request("/api/metrics");
  },

  sanitizeLLMContext(payload) {
    return request("/api/security/sanitize-llm-context", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
    tinyfishInvestigate(payload) {
    return request("/api/tinyfish/investigate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
