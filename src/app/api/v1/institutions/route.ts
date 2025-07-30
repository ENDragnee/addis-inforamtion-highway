// app/api/v1/institutions/route.js

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Make sure this path is correct

export async function GET(request: NextRequest) {
  try {
    const institutions = await prisma.institution.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(institutions);
  } catch (error) {
    console.error("API Error fetching institutions:", error);
    // Return a generic error response
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
