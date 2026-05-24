import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meters } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(m: typeof meters.$inferSelect) {
  return {
    id: m.id,
    meter_uid: m.meterUid,
    name: m.name,
    location: m.location,
    owner_user_id: m.ownerUserId,
    low_v_threshold: m.lowVThreshold,
    high_v_threshold: m.highVThreshold,
    relay_state: m.relayState,
    online: m.online,
    firmware_version: m.firmwareVersion,
    last_seen: m.lastSeen ? m.lastSeen.toISOString() : null,
    created_at: m.createdAt.toISOString(),
  };
}

async function load(id: number) {
  const [m] = await db.select().from(meters).where(eq(meters.id, id)).limit(1);
  return m ?? null;
}

function canAccess(meter: typeof meters.$inferSelect, role: string, userId: number) {
  return role === "admin" || meter.ownerUserId === userId;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const m = await load(id);
  if (!m) return jsonError("Not found", 404);
  if (!canAccess(m, auth.role, auth.id)) return jsonError("Forbidden", 403);

  return NextResponse.json(serialize(m));
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return jsonError("Admin only", 403);

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const body = await req.json().catch(() => ({}));
  const patch: Partial<typeof meters.$inferInsert> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (body.location !== undefined) patch.location = body.location;
  if (body.owner_user_id !== undefined) patch.ownerUserId = body.owner_user_id;
  if (typeof body.low_v_threshold === "number") patch.lowVThreshold = body.low_v_threshold;
  if (typeof body.high_v_threshold === "number") patch.highVThreshold = body.high_v_threshold;

  const [updated] = await db.update(meters).set(patch).where(eq(meters.id, id)).returning();
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(serialize(updated));
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return jsonError("Admin only", 403);

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const deleted = await db.delete(meters).where(eq(meters.id, id)).returning();
  if (deleted.length === 0) return jsonError("Not found", 404);
  return new NextResponse(null, { status: 204 });
}
