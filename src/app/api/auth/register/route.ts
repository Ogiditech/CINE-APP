import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/mock-store";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const passwordHash = await hashPassword(password);
    let createdUser: any = null;

    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, trimmedEmail))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const rows = await db
        .insert(users)
        .values({
          name,
          email: trimmedEmail,
          passwordHash,
          role: "USER",
          phone: phone || null,
        })
        .returning();

      createdUser = rows[0];
    } catch {
      // Memory Fallback
      if (memoryStore.users.some((u) => u.email === trimmedEmail)) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      createdUser = {
        id: `u-${Date.now()}`,
        name,
        email: trimmedEmail,
        passwordHash,
        role: "USER",
        phone: phone || null,
        createdAt: new Date().toISOString(),
      };
      memoryStore.users.push(createdUser);
    }

    const token = await signToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: createdUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
    });

    response.cookies.set({
      name: "cinebook_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
