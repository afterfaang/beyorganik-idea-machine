import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const competitors = await prisma.competitor.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(competitors);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, strengths, weaknesses, websiteUrl, instagramHandle } = body;

  const competitor = await prisma.competitor.create({
    data: { name, description, strengths, weaknesses, websiteUrl, instagramHandle },
  });

  return Response.json(competitor);
}
