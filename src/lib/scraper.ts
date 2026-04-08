import * as cheerio from "cheerio";

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BeyorganikBot/1.0)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return `Website erişilemedi: HTTP ${response.status}`;
    const html = await response.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, iframe, svg").remove();
    const title = $("title").text().trim();
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const headings = $("h1, h2, h3").map((_, el) => $(el).text().trim()).get().slice(0, 20).join(", ");
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);
    return `Başlık: ${title}\nMeta Açıklama: ${metaDesc}\nBaşlıklar: ${headings}\nİçerik Özeti: ${bodyText}`;
  } catch (error) {
    return `Website taraması başarısız: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
  }
}

export async function scrapeInstagram(handle: string): Promise<string> {
  try {
    const username = handle.replace("@", "");
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return `Instagram profili erişilemedi: HTTP ${response.status}`;
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("title").text().trim();
    const metaDesc = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
    return `Instagram Profili: ${username}\nBaşlık: ${title}\nAçıklama: ${metaDesc}`;
  } catch (error) {
    return `Instagram taraması başarısız (bu normal olabilir): ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
  }
}
