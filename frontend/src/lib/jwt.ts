import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/types";

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(s);
};

const ALG = "HS256";
const DEFAULT_EXP = "1d";

export interface JwtClaims {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
}

export async function signSession(claims: JwtClaims, expiresIn: string = DEFAULT_EXP): Promise<string> {
  return await new SignJWT({ role: claims.role, email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET());
}

export async function verifySession(token: string): Promise<JwtClaims | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET());
    return {
      sub: String(payload.sub ?? ""),
      role: payload.role as UserRole,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
