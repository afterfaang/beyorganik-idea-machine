import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateIdeas } from "@/lib/claude";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { categoryId, detailLevel, count, additionalContext, includeScanData } = body;

    const [brandProfile, competitors, category] = await Promise.all([
      prisma.brandProfile.findFirst(),
      prisma.competitor.findMany(),
      prisma.category.findUnique({ where: { id: categoryId } }),
    ]);

    if (!brandProfile) {
      return Response.json({ error: "Brand profile not found" }, { status: 404 });
    }
    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    let scanInsights: string | undefined;
    if (includeScanData) {
      const latestReport = await prisma.scanReport.findFirst({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
      });
      if (latestReport?.insights) {
        scanInsights = JSON.stringify(latestReport.insights);
      }
    }

    const generatedIdeas = await generateIdeas({
      brandInfo: {
        name: brandProfile.name,
        description: brandProfile.description,
        targetAudience: brandProfile.targetAudience,
        sector: brandProfile.sector,
        toneOfVoice: brandProfile.toneOfVoice,
      },
      competitors,
      categoryName: category.name,
      detailLevel,
      count,
      additionalContext,
      scanInsights,
    });

    const createdIdeas = await Promise.all(
      generatedIdeas.map((idea: { title: string; description: string }) =>
        prisma.idea.create({
          data: {
            title: idea.title,
            description: idea.description,
            detailLevel,
            categoryId,
            source: includeScanData ? "SCAN_BASED" : "MANUAL",
          },
          include: { category: true },
        })
      )
    );

    return Response.json({ ideas: createdIdeas });
  } catch (error) {
    console.error("Error generating ideas:", error);
    return Response.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
