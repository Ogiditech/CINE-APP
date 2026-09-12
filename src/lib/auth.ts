import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "cinebook_production_super_secure_jwt_secret_key_32_bytes_min";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
  name: string;
  [key: string]: any;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("cinebook_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function extractAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.cookies.get("cinebook_token")?.value || null;
}

export async function authenticateRequest(req: NextRequest): Promise<TokenPayload | null> {
  const token = extractAuthToken(req);
  if (!token) return null;
  return verifyToken(token);
}
