// File: /app/api/relationships/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth } from "@/lib/m2m-auth";

export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const institutionId = req.institution.id;
    const relationshipId = req.nextUrl.searchParams.get("relationshipId");

    if (!relationshipId) {
      return res
        .status(400)
        .json({ error: "Missing relationshipId parameter" });
    }

    // 1) Load institution (to get its role)
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: { role: true },
    });
    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    // 2) Load the relationship
    const relationship = await prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [
          { requesterRoleId: institution.role.id },
          { providerRoleId: institution.role.id },
        ],
      },
      
      include: {
        requesterRole: true,
        providerRole: true,
        dataSchema: true,
      },
    });

    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    // 3) Authorization: only the requester can fetch its own relationships
    if (relationship.requesterRoleId !== institution.role.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 4) Return full detail
    return res.status(200).json({
      status: relationship.status,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
      requesterRole: {
        name: relationship.requesterRole.name,
        description: relationship.requesterRole.description,
      },
      providerRole: {
        name: relationship.providerRole.name,
        description: relationship.providerRole.description,
      },
      dataSchema: {
        schemaId: relationship.dataSchema.schemaId,
        description: relationship.dataSchema.description,
      },
    });
  } catch (error) {
    console.error("GET /api/relationships/detail error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
