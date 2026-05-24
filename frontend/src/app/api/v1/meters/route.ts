import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { meters } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import { nanoid } from "nanoid";

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

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const all =
    auth.role === "admin"
      ? await db.select().from(meters).orderBy(asc(meters.id))
      : await db
          .select()
          .from(meters)
          .where(eq(meters.ownerUserId, auth.id))
          .orderBy(asc(meters.id));

  return NextResponse.json(all.map(serialize));
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return jsonError("Admin only", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string") return jsonError("Invalid payload");

  const meterUid = body.meter_uid ?? `M-${nanoid(8).toUpperCase()}`;
  const accessToken = nanoid(32);
  const accessTokenHash = await hashPassword(accessToken);

  const [created] = await db
    .insert(meters)
    .values({
      meterUid,
      name: body.name,
      location: body.location ?? null,
      ownerUserId: body.owner_user_id ?? null,
      accessTokenHash,
      lowVThreshold: body.low_v_threshold ?? 200,
      highVThreshold: body.high_v_threshold ?? 250,
    })
    .returning();

  return NextResponse.json({ ...serialize(created), access_token: accessToken });
}
