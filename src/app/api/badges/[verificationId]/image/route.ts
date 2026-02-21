import { db } from "@/lib/db";
import { badges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateBadgeImage } from "@/lib/badge-image";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const { verificationId } = await params;

  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.verificationId, verificationId));

  if (!badge) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (badge.isTakenDown) {
    return new NextResponse("Gone", { status: 410 });
  }

  const stats = badge.stats as { ai_percentage: number };
  const imageResponse = generateBadgeImage(stats.ai_percentage);

  // Clone the response to add cache headers
  const response = new NextResponse(imageResponse.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });

  return response;
}
