"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Activity,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  BellRing,
} from "lucide-react"
import React from "react"
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import Loading from "@/components/ui/loading"

// Define the data structures for type safety
type StatCardData = {
  title: string
  value: string
  change?: string
}

type ActivityLogItem = {
  id: string
  type: 'approved' | 'denied' | 'expired' | 'awaiting_consent' | 'completed' | (string & {})
  description: string
  timestamp: string
}

type PendingActionItem = {
  id:string
  description: string
  link: string
}

type DashboardData = {
  statCards: StatCardData[],
  activityLog: ActivityLogItem[],
  pendingActions: PendingActionItem[]
}

// Define the fetching function using axios
const fetchDashboardStats = async (): Promise<DashboardData> => {
  const { data } = await axios.get('/api/v1/super/dashboard-stats');
  return data;
};

// The "Stat Card" Component remains the same
const StatCard: React.FC<StatCardData & { icon: React.ReactNode }> = ({ title, value, icon, change }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && <p className="text-xs text-muted-foreground">{change}</p>}
    </CardContent>
  </Card>
)

// Main Dashboard Page Component
export default function DashboardPage() {
  const { data, error, isLoading } = useQuery<DashboardData, Error>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  // Handle loading and error states first
  if (isLoading) {
    return <Loading text="Loading dashboard overview..." />
  }

  if (error) {
    return <div className="p-6 text-destructive">Error: {error.message}</div>
  }

  // THE FIX: Add a definitive check for the data object.
  // After this point, TypeScript knows that `data` is of type `DashboardData`, not `DashboardData | undefined`.
  if (!data) {
    return <div className="p-6 text-muted-foreground">No data available.</div>;
  }

  // Helper function for rendering the correct icon
  const getActivityIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  }

  // NOTE: Now we can safely access `data.property` without optional chaining (`?.`)
  return (
    <div className="flex-1 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data.statCards.map((card, index) => (
          <StatCard key={index} {...card} 
            icon={
              index === 0 ? <Building2 className="h-4 w-4 text-muted-foreground" /> :
              index === 1 ? <Activity className="h-4 w-4 text-muted-foreground" /> :
              index === 2 ? <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> :
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Network Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {data.activityLog.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActivityIcon(item.type)}
                    <p className="text-sm">{item.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            {/* NOTE: The error is fixed. We can now safely access .length */}
            {data.pendingActions.length > 0 && <BellRing className="h-4 w-4 text-red-500 animate-pulse" />}
          </CardHeader>
          <CardContent>
            {data.pendingActions.length > 0 ? (
              <div className="space-y-4">
                {data.pendingActions.map((action) => (
                  <div key={action.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{action.description}</p>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={action.link}>Review</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No pending actions. System is healthy.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
