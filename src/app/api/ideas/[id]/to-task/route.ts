import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
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

  if (idea.status === "CONVERTED_TO_TASK") {
    return Response.json({ error: "Idea already converted to task" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: idea.title,
      description: idea.description,
      priority: idea.priorityScore ? Math.round(idea.priorityScore) : null,
      categoryId: idea.categoryId,
      ideaId: idea.id,
    },
    include: { category: true, idea: true },
  });

  await prisma.idea.update({
    where: { id },
    data: { status: "CONVERTED_TO_TASK" },
  });

  return Response.json(task);
}
