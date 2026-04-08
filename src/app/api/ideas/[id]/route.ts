import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!idea) {
    return Response.json({ error: "Idea not found" }, { status: 404 });
  }

  return Response.json(idea);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { impactScore, easeScore, status } = body;

  const data: Record<string, unknown> = {};
  if (impactScore !== undefined) data.impactScore = impactScore;
  if (easeScore !== undefined) data.easeScore = easeScore;
  if (status !== undefined) data.status = status;

  // Auto-calculate priorityScore
  if (impactScore !== undefined || easeScore !== undefined) {
    const existing = await prisma.idea.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Idea not found" }, { status: 404 });

    const finalImpact = impactScore ?? existing.impactScore;
    const finalEase = easeScore ?? existing.easeScore;
    if (finalImpact != null && finalEase != null) {
      data.priorityScore = (finalImpact * finalEase) / 2;
    }
  }

  const idea = await prisma.idea.update({
    where: { id },
    data,
    include: { category: true },
  });

  return Response.json(idea);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.idea.delete({ where: { id } });

  return Response.json({ success: true });
}
