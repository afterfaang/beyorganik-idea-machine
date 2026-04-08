import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!idea) {
    return Response.json({ error: "Idea not found" }, { status: 404 });
  }

  // Get brand profile and competitors for context
  const brandProfile = await prisma.brandProfile.findFirst();
  const competitors = await prisma.competitor.findMany();

  const brandInfo = brandProfile
    ? `Marka: ${brandProfile.name}\nAciklama: ${brandProfile.description}\nHedef Kitle: ${brandProfile.targetAudience}\nSektor: ${brandProfile.sector}\nTon: ${brandProfile.toneOfVoice}`
    : "Marka: Beyorganik\nSektor: Organik Gida E-Ticaret";

  const competitorText = competitors.length > 0
    ? competitors.map((c) => `- ${c.name}: ${c.description || "N/A"}`).join("\n")
    : "Rakip bilgisi mevcut degil";

  const prompt = `Sen Beyorganik markasi icin strateji danismanisin.
Asagidaki fikri kapsamli bir uygulama planina donustur.

Fikir: ${idea.title}
Mevcut Aciklama: ${idea.description}
Kategori: ${idea.category.name}

## Marka Bilgisi
${brandInfo}

## Rakipler
${competitorText}

Asagidaki basliklar altinda detayli bir plan hazirla:

## Neden Onemli
(Bu fikrin Beyorganik icin neden kritik oldugunu 2-3 cumle ile acikla)

## Uygulama Adimlari
(En az 7 adimlik detayli uygulama plani)

## Gerekli Kaynaklar
(Insan kaynagi, butce, araclar, sure)

## Beklenen Sonuclar
(Somut metrikler ve hedefler)

## Zaman Cizelgesi
(Haftalik veya aylik plan)

## Risk ve Cozumler
(Olasi riskler ve onlemler)

Markdown formatinda yanit ver.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const enhancedContent =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Update the idea with enhanced content
    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: {
        description: enhancedContent,
        detailLevel: "ACTION_PLAN",
      },
      include: { category: true },
    });

    return Response.json(updatedIdea);
  } catch (error) {
    console.error("Enhance error:", error);
    return Response.json(
      { error: "AI ile detaylandirma basarisiz oldu" },
      { status: 500 }
    );
  }
}
