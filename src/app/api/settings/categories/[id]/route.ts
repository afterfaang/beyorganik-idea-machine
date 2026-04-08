import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, icon, order } = body;

  const category = await prisma.category.update({
    where: { id },
    data: { name, icon, order },
  });

  return Response.json(category);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  if (!category.isCustom) {
    return Response.json({ error: "Cannot delete default categories" }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });

  return Response.json({ success: true });
}
