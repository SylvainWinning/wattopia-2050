import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMixSnapshot } from "@/lib/fetch-live-mix";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forceDemo = request.nextUrl.searchParams.get("demo") === "1";
  return NextResponse.json(await fetchLiveMixSnapshot(forceDemo));
}
