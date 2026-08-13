import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Defense-in-depth session check for Route Handlers. `src/proxy.ts` already
 * gates every non-login route, but Next.js's own guidance is not to rely on
 * Proxy alone for auth (a matcher change could silently drop coverage), so
 * each API route re-checks the session and returns a proper 401 JSON body
 * instead of Proxy's HTML redirect.
 */
export async function requireUserId(): Promise<string | NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return userId;
}
