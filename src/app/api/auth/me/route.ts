import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
