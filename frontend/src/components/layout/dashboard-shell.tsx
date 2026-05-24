"use client";

import { useEffect, useState } from "react";
import type { Meter, SessionUser, WSMessage } from "@/lib/types";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardProvider, useDashboard } from "@/providers/dashboard-provider";
import { useMeterSocket } from "@/lib/ws";
import { formatW } from "@/lib/format";

export function DashboardShell({
  user,
  token,
  meters,
  unreadAlerts,
  children,
}: {
  user: SessionUser;
  token: string;
  meters: Meter[];
  unreadAlerts: number;
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider
      user={user}
      token={token}
      initialMeters={meters}
      initialUnread={unreadAlerts}
    >
      <Inner>{children}</Inner>
    </DashboardProvider>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  const ctx = useDashboard();
  const { connected, last } = useMeterSocket(ctx.selectedMeterId, ctx.token);
  const [livePower, setLivePower] = useState<number | null>(null);
  const [liveVoltage, setLiveVoltage] = useState<number | null>(null);

  useEffect(() => {
    if (!last) return;
    const msg = last as WSMessage;
    if (msg.type === "reading") {
      const data = msg.data as Record<string, number>;
      if (typeof data.power === "number") setLivePower(data.power);
      if (typeof data.voltage === "number") setLiveVoltage(data.voltage);
    }
    if (msg.type === "alert") {
      ctx.setUnreadAlerts(ctx.unreadAlerts + 1);
    }
    // The page-level hooks listen too; this just maintains the topbar pill.
  }, [last, ctx]);

  const liveLabel =
    livePower !== null
      ? `Live · ${formatW(livePower)} · ${liveVoltage?.toFixed(1) ?? "—"} V`
      : "Live";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.user.role} />
      <div className="flex-1 flex flex-col">
        <Topbar
          user={ctx.user}
          meters={ctx.meters}
          selectedMeterId={ctx.selectedMeterId}
          onSelectMeter={ctx.selectMeter}
          liveLabel={liveLabel}
          unreadAlerts={ctx.unreadAlerts}
          connected={connected}
        />
        <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
