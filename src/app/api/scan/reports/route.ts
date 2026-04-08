import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.scanReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(reports);
}
