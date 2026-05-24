import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meterCommands, meters, relayEvents } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { loadMeterForUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const { meter, forbidden, notFound } = await loadMeterForUser(id, auth);
  if (notFound) return jsonError("Not found", 404);
  if (forbidden || !meter) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const action = body.action as "on" | "off" | undefined;
  const note = (body.note as string | undefined) ?? null;
  if (action !== "on" && action !== "off") return jsonError("action must be 'on' or 'off'");

  const desiredState = action === "on";

  // Update meter relay state immediately (assume the Pi will pick up the queued command).
  await db.update(meters).set({ relayState: desiredState }).where(eq(meters.id, id));

  // Queue the command for the Pi to poll.
  await db.insert(meterCommands).values({
    meterId: id,
    action: action === "on" ? "relay_on" : "relay_off",
    payload: null,
  });

  const [event] = await db
    .insert(relayEvents)
    .values({
      meterId: id,
      action,
      source: auth.role === "admin" ? "admin" : "user",
      requestedByUserId: auth.id,
      success: true,
      note,
    })
    .returning();

  return NextResponse.json({
    id: event.id,
    meter_id: event.meterId,
    ts: event.ts.toISOString(),
    action: event.action,
    source: event.source,
    requested_by_user_id: event.requestedByUserId,
    success: event.success,
    note: event.note,
  });
}
