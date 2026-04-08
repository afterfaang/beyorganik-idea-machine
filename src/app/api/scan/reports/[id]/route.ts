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

  const report = await prisma.scanReport.findUnique({
    where: { id },
  });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  const entries = await prisma.scanEntry.findMany({
    where: { scanReportId: id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ ...report, entries });
}
