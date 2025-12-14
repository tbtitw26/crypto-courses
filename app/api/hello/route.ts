import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await inngest.send({
    name: "test/hello.world",
    data: { email: "test@example.com" },
  });

  return NextResponse.json({ ok: true });
}

