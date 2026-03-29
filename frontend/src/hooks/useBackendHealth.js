import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function useBackendHealth() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);
        const payload = await response.json();
        if (active) setStatus(payload);
      } catch {
        if (active) setStatus({ ok: false });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHealth();
    return () => {
      active = false;
    };
  }, []);

  return { status, loading };
}
