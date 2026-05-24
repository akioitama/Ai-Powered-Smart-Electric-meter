"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/providers/dashboard-provider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/types";

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export default function AdminUsersPage() {
  const { token, user } = useDashboard();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (user.role !== "admin") return;
    api.listUsers(token).then(setUsers).catch(() => {});
  }, [user.role, token]);

  if (user.role !== "admin") return <p className="text-ink-muted">Admin only.</p>;

  async function setRole(id: number, role: UserRole) {
    const u = await api.setUserRole(id, role, token);
    setUsers((prev) => prev.map((p) => (p.id === id ? u : p)));
  }

  async function setActive(id: number, isActive: boolean) {
    const u = await api.setUserActive(id, isActive, token);
    setUsers((prev) => prev.map((p) => (p.id === id ? u : p)));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-electric-300">Administration</p>
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <Badge variant="muted">{users.length}</Badge>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Active</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-electric-400 to-lime-500 grid place-items-center text-bg font-bold text-xs">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                    </div>
                  </div>
                </TD>
                <TD className="text-ink-muted">{u.email}</TD>
                <TD>
                  <Select value={u.role} onValueChange={(v) => setRole(u.id, v as UserRole)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="consumer">Consumer</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </TD>
                <TD>
                  <Switch
                    checked={u.is_active}
                    onCheckedChange={(v) => setActive(u.id, v)}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
