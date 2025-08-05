import prisma from '@/lib/prisma';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Make sure to add this component

export default async function DataRequestsLogPage() {
  const requests = await prisma.dataRequest.findMany({
    take: 50, // Get the 50 most recent requests
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      requester: { select: { name: true } },
      provider: { select: { name: true } },
      dataSchema: { select: { schemaId: true } },
    }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Data Request Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.requester.name}</TableCell>
                  <TableCell>{req.provider.name}</TableCell>
                  <TableCell>{req.dataSchema.schemaId}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'COMPLETED' || req.status === 'APPROVED' ? 'default' : 'destructive'}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(req.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
