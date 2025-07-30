import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, ListCollapse } from 'lucide-react';

export default async function SuperDashboardPage() {
  // Fetch aggregate data concurrently for performance
  const [institutionCount, institutionUserCount, dataRequestCount] = await Promise.all([
    prisma.institution.count(),
    prisma.institutionUser.count(),
    prisma.dataRequest.count(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Institutions"
          value={institutionCount.toLocaleString()}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Total Institution Users"
          value={institutionUserCount.toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Total Data Requests"
          value={dataRequestCount.toLocaleString()}
          icon={<ListCollapse className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              A table or list of recent events (e.g., new institutions, failed requests) would go here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// A reusable component for stat cards
function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
