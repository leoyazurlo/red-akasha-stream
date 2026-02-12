import { useState, useEffect } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    connectionType: getConnectionType(),
  });

  useEffect(() => {
    const update = () => {
      setStatus({
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        connectionType: getConnectionType(),
      });
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      if (conn) conn.removeEventListener("change", update);
    };
  }, []);

  return status;
};

function getConnectionType(): string {
  const conn =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  if (!conn) return "unknown";
  return conn.effectiveType || conn.type || "unknown";
}
