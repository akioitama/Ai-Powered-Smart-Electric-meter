"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Meter, SessionUser } from "@/lib/types";

interface DashboardContextValue {
  user: SessionUser;
  token: string;
  meters: Meter[];
  setMeters: (m: Meter[]) => void;
  selectedMeterId: number | null;
  selectMeter: (id: number) => void;
  selectedMeter: Meter | null;
  unreadAlerts: number;
  setUnreadAlerts: (n: number) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

export function DashboardProvider({
  user,
  token,
  initialMeters,
  initialUnread,
  children,
}: {
  user: SessionUser;
  token: string;
  initialMeters: Meter[];
  initialUnread: number;
  children: React.ReactNode;
}) {
  const [meters, setMeters] = useState(initialMeters);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(() => {
    if (typeof window === "undefined") return initialMeters[0]?.id ?? null;
    const stored = window.localStorage.getItem("aimeter:selectedMeter");
    const fromStorage = stored ? Number(stored) : NaN;
    if (!Number.isNaN(fromStorage) && initialMeters.some((m) => m.id === fromStorage)) {
      return fromStorage;
    }
    return initialMeters[0]?.id ?? null;
  });
  const [unreadAlerts, setUnreadAlerts] = useState(initialUnread);

  useEffect(() => {
    if (selectedMeterId !== null) {
      window.localStorage.setItem("aimeter:selectedMeter", String(selectedMeterId));
    }
  }, [selectedMeterId]);

  const selectMeter = useCallback((id: number) => setSelectedMeterId(id), []);

  const selectedMeter = useMemo(
    () => meters.find((m) => m.id === selectedMeterId) ?? null,
    [meters, selectedMeterId],
  );

  const value: DashboardContextValue = {
    user,
    token,
    meters,
    setMeters,
    selectedMeterId,
    selectMeter,
    selectedMeter,
    unreadAlerts,
    setUnreadAlerts,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
