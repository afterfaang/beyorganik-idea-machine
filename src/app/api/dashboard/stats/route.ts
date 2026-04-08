import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    ideasThisWeek,
    convertedToTask,
    completedTasks,
    totalActiveIdeas,
    lastScan,
    categoryDistribution,
    topTasks,
  ] = await Promise.all([
    prisma.idea.count({
      where: { createdAt: { gte: startOfWeek } },
    }),
    prisma.idea.count({
      where: { status: "CONVERTED_TO_TASK" },
    }),
    prisma.task.count({
      where: { status: "DONE" },
    }),
    prisma.idea.count({
      where: { status: "ACTIVE" },
    }),
    prisma.scanReport.findFirst({
      orderBy: { createdAt: "desc" },
      select: { type: true, createdAt: true, summary: true },
    }),
    prisma.idea.groupBy({
      by: ["categoryId"],
      _count: { id: true },
    }),
    prisma.task.findMany({
      where: { status: { not: "DONE" } },
      orderBy: { priority: "desc" },
      take: 5,
      include: { category: true },
    }),
  ]);

  // Resolve category names for distribution
  const categoryIds = categoryDistribution.map((c: { categoryId: string }) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]));

  const distribution = categoryDistribution.map((c: { categoryId: string; _count: { id: number } }) => ({
    category: categoryMap.get(c.categoryId) || "Unknown",
    count: c._count.id,
  }));

  return Response.json({
    ideasThisWeek,
    convertedToTask,
    completedTasks,
    totalActiveIdeas,
    lastScan,
    categoryDistribution: distribution,
    topTasks,
  });
}
