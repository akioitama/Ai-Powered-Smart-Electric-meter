"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Reading, WSMessage } from "@/lib/types";

/**
 * Polling-based replacement for the original WebSocket hook. On Vercel
 * we can't keep a long-lived socket open, so the dashboard polls the
 * latest reading every few seconds and surfaces the same `{connected, last}`
 * shape consumers expect.
 */
export function useMeterSocket(meterId: number | null, token: string | null) {
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<WSMessage | null>(null);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!meterId || !token) {
      setConnected(false);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const r = (await api.latestReading(meterId!, token!)) as Reading;
        if (!alive) return;
        setConnected(true);
        if (r.id !== lastIdRef.current) {
          lastIdRef.current = r.id;
          setLast({
            type: "reading",
            data: { ...r } as unknown as Record<string, unknown>,
          });
        }
      } catch {
        if (alive) setConnected(false);
      } finally {
        if (alive) timer = setTimeout(tick, 2500);
      }
    }

    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [meterId, token]);

  return { connected, last };
}
