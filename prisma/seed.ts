import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create user
  await prisma.user.upsert({
    where: { email: "serhat@afterfaang.com" },
    update: {},
    create: {
      email: "serhat@afterfaang.com",
      password: hashSync("1111111", 10),
      name: "Serhat",
    },
  });

  // Create brand profile
  const existingBrand = await prisma.brandProfile.findFirst();
  if (!existingBrand) {
    await prisma.brandProfile.create({
      data: {
        name: "Beyorganik",
        description: "Türkiye'nin önde gelen organik gıda e-ticaret markası. Sertifikalı organik ürünler sunarak sağlıklı yaşamı herkes için erişilebilir kılmayı hedefler.",
        targetAudience: "Sağlıklı beslenmeye önem veren, organik ürün tüketen, 25-55 yaş arası bilinçli tüketiciler",
        toneOfVoice: "Samimi, güvenilir, doğal, bilgilendirici",
        websiteUrl: "https://www.beyorganik.com",
        instagramHandle: "@beyorganik",
        sector: "Organik Gıda E-Ticaret",
      },
    });
  }

  // Create competitors
  const competitors = [
    { name: "Ravla", websiteUrl: "https://www.ravla.com", instagramHandle: "@ravla", description: "Organik ve doğal gıda ürünleri sunan e-ticaret markası" },
    { name: "OG Natural", websiteUrl: "https://www.ognatural.com", instagramHandle: "@ognatural", description: "Doğal ve organik ürünler kategorisinde faaliyet gösteren e-ticaret markası" },
  ];
  for (const comp of competitors) {
    const exists = await prisma.competitor.findFirst({ where: { name: comp.name } });
    if (!exists) {
      await prisma.competitor.create({ data: comp });
    }
  }

  // Create default categories
  const categories = [
    { name: "Pazarlama & İçerik", icon: "Megaphone", order: 1 },
    { name: "E-ticaret & Dönüşüm Optimizasyonu", icon: "ShoppingCart", order: 2 },
    { name: "Ürün Geliştirme & Üretim", icon: "Package", order: 3 },
    { name: "Kullanıcı Deneyimi (UX/UI)", icon: "Layout", order: 4 },
    { name: "Müşteri Sadakati & CRM", icon: "Heart", order: 5 },
    { name: "Sosyal Medya & Topluluk", icon: "Users", order: 6 },
    { name: "SEO & Organik Büyüme", icon: "TrendingUp", order: 7 },
    { name: "Kargo & Operasyon", icon: "Truck", order: 8 },
  ];
  for (const cat of categories) {
    const exists = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!exists) {
      await prisma.category.create({ data: { ...cat, isDefault: true } });
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
