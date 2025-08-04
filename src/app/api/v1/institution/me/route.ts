import { withM2MAuth } from "@/lib/m2m-auth";
import prisma from "@/lib/prisma";
import { fa, tr } from "zod/v4/locales";

export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const institutionId = req.institution?.id;
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        role: true,
      },
    });

    return res
      .status(200)
      .json(req.institution || { error: "Institution not found" });
      
  } catch (error) {
    console.error("Error in POST handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
