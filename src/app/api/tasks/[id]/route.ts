import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, order, description, priority } = body;

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (order !== undefined) data.order = order;
  if (description !== undefined) data.description = description;
  if (priority !== undefined) data.priority = priority;

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { category: true, idea: true },
  });

  return Response.json(task);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

  // If task has a linked idea, reset idea status to ACTIVE
  if (task.ideaId) {
    await prisma.idea.update({
      where: { id: task.ideaId },
      data: { status: "ACTIVE" },
    });
  }

  await prisma.task.delete({ where: { id } });

  return Response.json({ success: true });
}
