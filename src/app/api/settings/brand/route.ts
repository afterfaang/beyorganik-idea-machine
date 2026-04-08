import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const brand = await prisma.brandProfile.findFirst();

  return Response.json(brand);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, targetAudience, toneOfVoice, websiteUrl, instagramHandle, sector } = body;

  const existing = await prisma.brandProfile.findFirst();

  let brand;
  if (existing) {
    brand = await prisma.brandProfile.update({
      where: { id: existing.id },
      data: { name, description, targetAudience, toneOfVoice, websiteUrl, instagramHandle, sector },
    });
  } else {
    brand = await prisma.brandProfile.create({
      data: { name, description, targetAudience, toneOfVoice, websiteUrl, instagramHandle, sector },
    });
  }

  return Response.json(brand);
}
