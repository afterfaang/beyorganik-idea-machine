import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeWebsite, scrapeInstagram } from "@/lib/scraper";
import { analyzeScanData } from "@/lib/claude";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.scanReport.create({
    data: { type: "MANUAL", status: "RUNNING" },
  });

  try {
    const [brandProfile, competitors] = await Promise.all([
      prisma.brandProfile.findFirst(),
      prisma.competitor.findMany(),
    ]);

    if (!brandProfile) {
      await prisma.scanReport.update({
        where: { id: report.id },
        data: { status: "FAILED" },
      });
      return Response.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const targets = [
      { name: brandProfile.name, websiteUrl: brandProfile.websiteUrl, instagramHandle: brandProfile.instagramHandle },
      ...competitors.map((c: { name: string; websiteUrl: string; instagramHandle: string }) => ({ name: c.name, websiteUrl: c.websiteUrl, instagramHandle: c.instagramHandle })),
    ];

    const scanData: { brandName: string; sourceType: string; content: string }[] = [];

    for (const target of targets) {
      const websiteContent = await scrapeWebsite(target.websiteUrl);
      await prisma.scanEntry.create({
        data: {
          scanReportId: report.id,
          brandName: target.name,
          sourceType: "website",
          sourceUrl: target.websiteUrl,
          rawContent: websiteContent,
        },
      });
      scanData.push({ brandName: target.name, sourceType: "website", content: websiteContent });

      const instagramContent = await scrapeInstagram(target.instagramHandle);
      await prisma.scanEntry.create({
        data: {
          scanReportId: report.id,
          brandName: target.name,
          sourceType: "instagram",
          sourceUrl: `https://instagram.com/${target.instagramHandle.replace("@", "")}`,
          rawContent: instagramContent,
        },
      });
      scanData.push({ brandName: target.name, sourceType: "instagram", content: instagramContent });
    }

    const analysis = await analyzeScanData({
      brandInfo: {
        name: brandProfile.name,
        description: brandProfile.description,
        targetAudience: brandProfile.targetAudience,
        sector: brandProfile.sector,
        toneOfVoice: brandProfile.toneOfVoice,
      },
      scanData,
    });

    const updatedReport = await prisma.scanReport.update({
      where: { id: report.id },
      data: {
        status: "COMPLETED",
        insights: analysis,
        summary: analysis.summary,
        completedAt: new Date(),
      },
    });

    return Response.json(updatedReport);
  } catch (error) {
    console.error("Scan failed:", error);
    await prisma.scanReport.update({
      where: { id: report.id },
      data: { status: "FAILED" },
    });
    return Response.json({ error: "Scan failed" }, { status: 500 });
  }
}
