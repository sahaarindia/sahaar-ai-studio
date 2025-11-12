import { NextResponse } from "next/server";
import { voices } from "@/src/data/voices";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ voices });
}
