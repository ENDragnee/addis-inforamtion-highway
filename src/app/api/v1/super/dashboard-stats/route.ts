import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ensure this path is correct
import prisma from '@/lib/prisma'; // Ensure this path is correct
import { DataRequestStatus } from '@prisma/client';

export async function GET() {
  // 1. Authenticate and Authorize the user
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 2. Fetch all required data from the database concurrently for performance
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      institutionCount,
      activeRelationshipsCount,
      requestsTodayCount,
      completedRequestsCount,
      failedRequestsCount,
      recentActivityQuery,
      pendingRelationshipsCount,
    ] = await Promise.all([
      prisma.institution.count(),
      prisma.relationship.count({ where: { status: 'ACTIVE' } }),
      prisma.dataRequest.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.dataRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.dataRequest.count({ where: { status: 'FAILED' } }),
      prisma.dataRequest.findMany({
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: {
          requester: { select: { name: true } },
          provider: { select: { name: true } },
          dataSchema: { select: { schemaId: true } },
        },
      }),
      prisma.relationship.count({ where: { status: 'PENDING' } }),
    ]);

    // 3. Transform the raw database data into the format expected by the frontend

    // --- Format Stat Cards ---
    const totalRequests = completedRequestsCount + failedRequestsCount;
    const successRate = totalRequests > 0 
      ? ((completedRequestsCount / totalRequests) * 100).toFixed(1) 
      : '0.0';

    const statCards = [
      {
        title: "Total Institutions",
        value: institutionCount.toLocaleString(),
        change: "+2 this week", // Note: "change" data is hardcoded for now
      },
      {
        title: "Active Relationships",
        value: activeRelationshipsCount.toLocaleString(),
        change: "+15 since last month",
      },
      {
        title: "Data Requests (24h)",
        value: requestsTodayCount.toLocaleString(),
        change: "+12% from yesterday",
      },
      {
        title: "Success Rate",
        value: `${successRate}%`,
        change: "+0.1% from last week",
      },
    ];

    // --- Format Activity Log ---
    const activityLog = recentActivityQuery.map(req => {
      let description = '';
      const status = req.status.toLowerCase() as ActivityLogItem['type'];

      switch (req.status) {
        case DataRequestStatus.APPROVED:
          description = `${req.requester.name} request for ${req.dataSchema.schemaId} from ${req.provider.name} was approved.`;
          break;
        case DataRequestStatus.COMPLETED:
          description = `${req.requester.name} successfully completed a ${req.dataSchema.schemaId} request from ${req.provider.name}.`;
          break;
        case DataRequestStatus.DENIED:
          description = `User denied ${req.requester.name}'s request for ${req.dataSchema.schemaId}.`;
          break;
        case DataRequestStatus.EXPIRED:
          description = `${req.requester.name}'s request for ${req.dataSchema.schemaId} has expired.`;
          break;
        case DataRequestStatus.AWAITING_CONSENT:
          description = `${req.requester.name} is awaiting consent for ${req.dataSchema.schemaId} from ${req.provider.name}.`;
          break;
        default:
          description = `Request ${req.id.substring(0, 8)} status is now ${req.status}.`;
      }
      
      return {
        id: req.id,
        type: status,
        description: description,
        timestamp: req.updatedAt.toISOString(), // Frontend will format this
      };
    });

    // --- Format Pending Actions ---
    const pendingActions = [];
    if (pendingRelationshipsCount > 0) {
      pendingActions.push({
        id: 'pend_relationships',
        description: `${pendingRelationshipsCount} relationship proposal(s) awaiting approval.`,
        link: '/super/dashboard/relationships', // Note: Renamed from /admin
      });
    }
    // NOTE: In the future, you can add queries for pending institutions or schemas here
    // and push them into the `pendingActions` array.

    // 4. Send the structured data as a JSON response
    return NextResponse.json({
      statCards,
      activityLog,
      pendingActions,
    });

  } catch (error) {
    console.error("Superuser Dashboard API Error:", error);
    return NextResponse.json({ error: 'An internal server error occurred while fetching dashboard data.' }, { status: 500 });
  }
}

// Define the types within the API file for self-documentation.
// These must match the types expected by the frontend component.
type ActivityLogItem = {
  id: string
  type: 'approved' | 'denied' | 'expired' | 'awaiting_consent' | 'completed' | (string & {})
  description: string
  timestamp: string
}
