import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (source) where.source = source;

  const orderBy: Record<string, string> = {};
  if (sortBy === "priorityScore") {
    orderBy.priorityScore = "desc";
  } else if (sortBy === "impactScore") {
    orderBy.impactScore = "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      include: { category: true },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.idea.count({ where }),
  ]);

  return Response.json({ ideas, total, page, limit });
}
