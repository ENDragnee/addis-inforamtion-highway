import { withM2MAuth } from "@/lib/m2m-auth";
import prisma from "@/lib/prisma";
import { fa, tr } from "zod/v4/locales";

export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const { provderId } = req.params;
    
    const provder = await prisma.institution.findUnique({
      where: { id: provderId },
        include: {
            role: true,            
        }
    });

    if (!provder) {
      return res.status(404).json({ error: "Institution not found" });
    }

    return res.status(200).json({
        name: provder.name,
        role: {
            name: provder.role.name,
            description: provder.role.description,
        },
        publicKey: provder.publicKey,
    });
        
  } catch (error) {
    console.error("Error in POST handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } 
});