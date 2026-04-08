import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateIdeas(params: {
  brandInfo: { name: string; description: string; targetAudience: string; sector: string; toneOfVoice: string };
  competitors: { name: string; description?: string | null; strengths?: string | null; weaknesses?: string | null }[];
  categoryName: string;
  detailLevel: string;
  count: number;
  additionalContext?: string;
  scanInsights?: string;
}) {
  const { brandInfo, competitors, categoryName, detailLevel, count, additionalContext, scanInsights } = params;

  const competitorText = competitors.map(c =>
    `- ${c.name}: ${c.description || "N/A"}\n  Güçlü Yönleri: ${c.strengths || "Belirtilmemiş"}\n  Zayıf Yönleri: ${c.weaknesses || "Belirtilmemiş"}`
  ).join("\n");

  const prompt = `Sen Beyorganik markası için yaratıcı ve uygulanabilir fikirler üreten bir strateji danışmanısın.

## Marka Bilgisi
- Marka: ${brandInfo.name}
- Açıklama: ${brandInfo.description}
- Hedef Kitle: ${brandInfo.targetAudience}
- Sektör: ${brandInfo.sector}
- Ton: ${brandInfo.toneOfVoice}

## Rakipler
${competitorText}

## Son Tarama İçgörüleri
${scanInsights || "Henüz tarama yapılmadı"}

## Görev
"${categoryName}" kategorisinde ${count} adet fikir üret.
Detay seviyesi: ${detailLevel}
${additionalContext ? `Ek bağlam: ${additionalContext}` : ""}

## Detay Seviyesi Kuralları
- QUICK: Sadece başlık ve 1 cümle açıklama
- DETAILED: Başlık, 2-3 cümle açıklama, neden önemli olduğu, beklenen etki
- ACTION_PLAN: Başlık, detaylı açıklama, adım adım uygulama planı (en az 5 adım), gerekli kaynaklar, beklenen sonuçlar

## Kurallar
- Fikirler Beyorganik'in marka kimliğine uygun olmalı
- Rakiplerin zayıf yönlerinden faydalanacak fikirler öncelikli
- Organik gıda e-ticaret sektörüne özgü ve uygulanabilir fikirler üret
- Her fikir benzersiz ve spesifik olmalı, genel tavsiyelerden kaçın

## Yanıt Formatı (JSON)
{
  "ideas": [
    {
      "title": "...",
      "description": "..."
    }
  ]
}

SADECE JSON formatında yanıt ver, başka hiçbir şey ekleme.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = safeParseJSON(text);
  return parsed.ideas as { title: string; description: string }[];
}

function safeParseJSON(text: string) {
  // Try direct parse first
  try { return JSON.parse(text); } catch {}
  // Try extracting JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  // Try finding first { to last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  throw new Error("Could not parse JSON from AI response");
}

export async function analyzeScanData(params: {
  brandInfo: { name: string; description: string; targetAudience: string; sector: string; toneOfVoice: string };
  scanData: { brandName: string; sourceType: string; content: string }[];
}) {
  const { brandInfo, scanData } = params;

  const scanDataText = scanData.map(d =>
    `### ${d.brandName} - ${d.sourceType}\n${d.content}`
  ).join("\n\n");

  const prompt = `Sen bir dijital pazarlama ve e-ticaret analisti olarak çalışıyorsun.
Aşağıda bir organik gıda markasının ve rakiplerinin web sitesi ve Instagram verilerini analiz et.

## Marka Bilgisi
- Marka: ${brandInfo.name}
- Açıklama: ${brandInfo.description}
- Hedef Kitle: ${brandInfo.targetAudience}
- Sektör: ${brandInfo.sector}

## Tarama Verileri
${scanDataText}

## Görev
Her marka için aşağıdaki analizleri yap:
1. **Website Analizi:** Öne çıkan ürünler, kampanyalar, fiyatlama stratejisi, yeni özellikler
2. **Instagram Analizi:** Son paylaşım temaları, içerik formatları, etkileşim gözlemleri
3. **Karşılaştırmalı Değerlendirme:** Rakiplerin avantajları ve dezavantajları
4. **Fırsat Alanları:** En az 5 spesifik fırsat önerisi

## Yanıt Formatı (JSON)
{
  "summary": "Genel 1 paragraf özet",
  "brandAnalyses": [
    {
      "brandName": "...",
      "websiteInsights": "...",
      "instagramInsights": "...",
      "highlights": ["...", "..."]
    }
  ],
  "opportunities": ["...", "..."],
  "competitiveGaps": ["...", "..."]
}

SADECE JSON formatında yanıt ver.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return safeParseJSON(text);
}
