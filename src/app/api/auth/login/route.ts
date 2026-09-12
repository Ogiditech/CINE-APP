import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signToken } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/mock-store";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    let user: any = null;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);
      user = rows[0] || null;
    } catch {
      // Fallback
      user =
        memoryStore.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase().trim()
        ) || null;
    }

    // Demo shortcut for immediate testing if not in DB
    if (!user) {
      if (email === "admin@cinebook.com" && password === "AdminPass123!") {
        user = memoryStore.users.find((u) => u.email === "admin@cinebook.com");
      } else if (
        email === "viewer@cinebook.com" &&
        password === "ViewerPass123!"
      ) {
        user = memoryStore.users.find((u) => u.email === "viewer@cinebook.com");
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Validate password (or accept demo credentials)
    const isValid =
      (await comparePassword(password, user.passwordHash)) ||
      (email === "admin@cinebook.com" && password === "AdminPass123!") ||
      (email === "viewer@cinebook.com" && password === "ViewerPass123!");

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: "cinebook_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
