import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const propertyType = await prisma.propertyType.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    });

    if (!propertyType) {
      return NextResponse.json(
        { error: "Property type not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: propertyType }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch property type:", error);
    return NextResponse.json(
      { error: "Failed to fetch property type" },
      { status: 500 },
    );
  }
}

type PatchPropertyTypeBody = {
  name_en?: string;
  name_ar?: string | null;
  name_fr?: string | null;
  slug?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchPropertyTypeBody;
    const { name_en, name_ar, name_fr, slug } = body;

    // Verify property type exists
    const existing = await prisma.propertyType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Property type not found" },
        { status: 404 },
      );
    }

    const updateData: Partial<PatchPropertyTypeBody & { name: string }> = {};
    if (name_en) {
      const cleaned = name_en.trim();
      updateData.name_en = cleaned;
      updateData.name = cleaned;
    }
    if (name_ar !== undefined) {
      updateData.name_ar = name_ar?.trim() || null;
    }
    if (name_fr !== undefined) {
      updateData.name_fr = name_fr?.trim() || null;
    }
    if (slug !== undefined) {
      updateData.slug = slug?.trim() || null;
    }

    const propertyType = await prisma.propertyType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: propertyType }, { status: 200 });
  } catch (error) {
    console.error("Failed to update property type:", error);
    return NextResponse.json(
      { error: "Failed to update property type" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify property type exists
    const existing = await prisma.propertyType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Property type not found" },
        { status: 404 },
      );
    }

    // Check if there are properties associated with this property type
    const propertiesCount = await prisma.property.count({
      where: { propertyTypeId: id },
    });

    if (propertiesCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete property type that has associated properties",
        },
        { status: 409 },
      );
    }

    await prisma.propertyType.delete({ where: { id } });

    return NextResponse.json(
      { message: "Property type deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete property type:", error);
    return NextResponse.json(
      { error: "Failed to delete property type" },
      { status: 500 },
    );
  }
}
