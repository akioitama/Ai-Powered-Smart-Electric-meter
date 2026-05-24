import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = getServerSession();
  if (!session) redirect("/login");

  const [meters, alerts] = await Promise.all([
    api.listMeters(session.token, true).catch(() => []),
    api
      .listAlerts(session.token, { unackOnly: true, limit: 50 }, true)
      .catch(() => []),
  ]);

  return (
    <DashboardShell
      user={session.user}
      token={session.token}
      meters={meters}
      unreadAlerts={alerts.length}
    >
      {children}
    </DashboardShell>
  );
}
