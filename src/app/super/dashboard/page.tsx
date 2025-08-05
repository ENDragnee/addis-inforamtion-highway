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

// Part 1: Define the Data Structures (TypeScript)
type StatCardProps = {
  title: string
  value: string
  icon: React.ReactNode
  change?: string
}

type ActivityLogItem = {
  id: string
  type: 'approved' | 'denied' | 'expired' | 'pending' | 'completed'
  description: string
  timestamp: string
}

type PendingActionItem = {
  id: string
  description: string
  link: string
}

// Part 2: Create Mock Data
const mockStatCards: StatCardProps[] = [
  {
    title: "Total Institutions",
    value: "1,257",
    icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
    change: "+2 this week",
  },
  {
    title: "Active Relationships",
    value: "890",
    icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    change: "+15 since last month",
  },
  {
    title: "Data Requests (24h)",
    value: "3,450",
    icon: <ArrowUpRight className="h-4 w-4 text-muted-foreground" />,
    change: "+12% from yesterday",
  },
  {
    title: "Success Rate",
    value: "98.5%",
    icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
    change: "+0.1% from last week",
  },
]

const mockActivityLog: ActivityLogItem[] = [
  {
    id: "act_001",
    type: "approved",
    description: "Awash Bank approved Salary_v1 from Ethio Telecom.",
    timestamp: "2 hours ago",
  },
  {
    id: "act_002",
    type: "denied",
    description: "Ministry of Health denied BirthCert_v1 from Red Cross.",
    timestamp: "4 hours ago",
  },
  {
    id: "act_003",
    type: "completed",
    description: "University of Addis completed Degree_v1 request from MoE.",
    timestamp: "1 day ago",
  },
  {
    id: "act_004",
    type: "pending",
    description: "Commercial Bank of Ethiopia requested ID_v1 from Person X.",
    timestamp: "2 days ago",
  },
  {
    id: "act_005",
    type: "expired",
    description: "Ethio Telecom Salary_v1 request from Person Y expired.",
    timestamp: "3 days ago",
  },
  {
    id: "act_006",
    type: "approved",
    description: "Federal Police approved CriminalRecord_v1 from Court Z.",
    timestamp: "4 days ago",
  },
]

const mockPendingActions: PendingActionItem[] = [
  {
    id: "pend_001",
    description: "Bank of Abyssinia proposed a new rule.",
    link: "/admin/relationships",
  },
  {
    id: "pend_002",
    description: "New institution 'ABC Corp' awaiting approval.",
    link: "/admin/institutions",
  },
  {
    id: "pend_003",
    description: "Schema 'HealthRecord_v2' requires review.",
    link: "/admin/schemas",
  },
]

// The "Stat Card" Component
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change }) => (
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

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Part 3: Build the Page Layout (CSS Grid) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Cards */}
        {mockStatCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Network Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {mockActivityLog.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.type === "approved" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.type === "denied" && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {item.type === "expired" && (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                    {(item.type === "pending" || item.type === "completed") && (
                      <Activity className="h-5 w-5 text-blue-500" />
                    )} {/* Generic icon for other types */}
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {item.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Link href="/admin/audit">
              <Button variant="outline" className="w-full">View Full Audit Trail</Button>
            </Link>
          </div>
        </Card>

        {/* Action Required Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <BellRing className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingActions.map((action) => (
                <div key={action.id} className="flex flex-col gap-2">
                  <p className="text-sm text-gray-700">{action.description}</p>
                  <Link href={action.link}>
                    <Button variant="secondary" className="w-full">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
