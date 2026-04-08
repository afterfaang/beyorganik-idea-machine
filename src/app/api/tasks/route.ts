import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    include: { category: true, idea: true },
    orderBy: { order: "asc" },
  });

  return Response.json(tasks);
}
