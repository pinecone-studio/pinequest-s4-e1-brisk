"use client";

import { useEffect, useRef } from "react";

type UseNotificationStreamOptions = {
  enabled?: boolean;
  onConnected?: () => void;
  onHeartbeat?: () => void;
};

export function useNotificationStream({
  enabled = true,
  onConnected,
  onHeartbeat,
}: UseNotificationStreamOptions = {}) {
  const onConnectedRef = useRef(onConnected);
  const onHeartbeatRef = useRef(onHeartbeat);

  useEffect(() => {
    onConnectedRef.current = onConnected;
    onHeartbeatRef.current = onHeartbeat;
  }, [onConnected, onHeartbeat]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const source = new EventSource("/api/backend/notifications/stream");

    source.addEventListener("connected", () => {
      onConnectedRef.current?.();
    });

    source.addEventListener("heartbeat", () => {
      onHeartbeatRef.current?.();
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [enabled]);
}
