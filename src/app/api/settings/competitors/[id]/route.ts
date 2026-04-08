import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, strengths, weaknesses, websiteUrl, instagramHandle } = body;

  const competitor = await prisma.competitor.update({
    where: { id },
    data: { name, description, strengths, weaknesses, websiteUrl, instagramHandle },
  });

  return Response.json(competitor);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.competitor.delete({ where: { id } });

  return Response.json({ success: true });
}
