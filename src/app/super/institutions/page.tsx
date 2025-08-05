import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { InstitutionStatus } from "@/generated/prisma/client";
import {
  // UPDATED: We only need upsertInstitutionAction here
  upsertInstitutionAction,
} from "@/actions/super/institutions";
import { InstitutionActions } from "@/components/super/InstitutionActions";
import { CreateInstitutionButton } from "@/components/super/CreateInstitutionButton";

// This is a Server Component
export default async function InstitutionsPage() {
  const institutions = await prisma.institution.findMany({
    orderBy: { createdAt: 'desc' },
    include: { role: true },
  });

  const roles = await prisma.role.findMany();

  const getBadgeVariant = (status: InstitutionStatus) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'SUSPENDED': 'destructive';
      case 'PENDING': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Institution Management</h1>
        <CreateInstitutionButton 
          roles={roles} 
          upsertAction={upsertInstitutionAction} 
        />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>INSTITUTION</TableHead>
              <TableHead>CLIENT ID</TableHead>
              <TableHead>PUBLIC KEY</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.map((institution) => (
              <TableRow key={institution.id}>
                <TableCell>
                  <div className="font-bold">{institution.name}</div>
                  <div className="text-sm text-muted-foreground">{institution.role.name}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{institution.clientId}</TableCell>
                <TableCell className="font-mono text-xs">{institution.publicKey}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(institution.status)}>
                    {institution.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InstitutionActions 
                    institution={institution} 
                    roles={roles}
                    upsertAction={upsertInstitutionAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
