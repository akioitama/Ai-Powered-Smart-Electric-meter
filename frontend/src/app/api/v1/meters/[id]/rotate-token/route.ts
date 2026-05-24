import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { meters } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return jsonError("Admin only", 403);

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id");

  const accessToken = nanoid(32);
  const accessTokenHash = await hashPassword(accessToken);
  const [updated] = await db
    .update(meters)
    .set({ accessTokenHash })
    .where(eq(meters.id, id))
    .returning();
  if (!updated) return jsonError("Not found", 404);

  return NextResponse.json({
    id: updated.id,
    meter_uid: updated.meterUid,
    name: updated.name,
    location: updated.location,
    owner_user_id: updated.ownerUserId,
    low_v_threshold: updated.lowVThreshold,
    high_v_threshold: updated.highVThreshold,
    relay_state: updated.relayState,
    online: updated.online,
    firmware_version: updated.firmwareVersion,
    last_seen: updated.lastSeen ? updated.lastSeen.toISOString() : null,
    created_at: updated.createdAt.toISOString(),
    access_token: accessToken,
  });
}
