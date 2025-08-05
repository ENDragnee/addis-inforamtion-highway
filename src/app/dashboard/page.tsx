import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

async function getDashboardData(institutionId: string) {
  const [activeRelationships, requestsMade, recentRequests] = await Promise.all([
    // Count active relationships this institution is part of
    prisma.relationship.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { requesterRole: { institutions: { some: { id: institutionId } } } },
          { providerRole: { institutions: { some: { id: institutionId } } } },
        ],
      },
    }),
    // Count data requests made by this institution
    prisma.dataRequest.count({
      where: { requesterId: institutionId },
    }),
    // Get the 5 most recent requests involving this institution
    prisma.dataRequest.findMany({
      where: {
        OR: [
          { requesterId: institutionId },
          { providerId: institutionId },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { name: true } },
        provider: { select: { name: true } },
        dataSchema: { select: { schemaId: true } },
      },
    }),
  ]);
  return { activeRelationships, requestsMade, recentRequests };
}


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  // The layout already protects this page, but it's good practice to have the session object
  const institutionId = session!.user.institutionId!;
  const { activeRelationships, requestsMade, recentRequests } = await getDashboardData(institutionId);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Relationships</CardDescription>
            <CardTitle className="text-4xl">{activeRelationships}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total approved data sharing connections.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Data Requests Made</CardDescription>
            <CardTitle className="text-4xl">{requestsMade}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total requests initiated by your institution.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consent Rate</CardDescription>
            <CardTitle className="text-4xl">92.1%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              (Placeholder) of requests approved by users.
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            The latest data requests involving your institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    {req.requesterId === institutionId ? (
                        <Badge variant="outline">Requester</Badge>
                    ) : (
                        <Badge variant="secondary">Provider</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.requesterId === institutionId ? req.provider.name : req.requester.name}
                  </TableCell>
                  <TableCell>{req.dataSchema.schemaId}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'COMPLETED' || req.status === 'APPROVED' ? 'default' : 'destructive'}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
