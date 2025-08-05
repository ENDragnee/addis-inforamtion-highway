"use client"

import { useState } from "react"
import { useDebounce } from 'use-debounce';
import { Search, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetAuditLogs, exportToExcel, AuditFilters } from "@/hooks/use-audit-logs"
import { DataRequestStatus } from "@/generated/prisma/client"
import Loading from "@/components/ui/loading"
import PaginationControls from "@/components/ui/pagination-controls"
import { format } from 'date-fns';

const allStatuses: (DataRequestStatus | 'all')[] = ['all', 'INITIATED', 'AWAITING_CONSENT', 'APPROVED', 'COMPLETED', 'DENIED', 'FAILED', 'EXPIRED'];

const StatusBadge: React.FC<{ status: DataRequestStatus }> = ({ status }) => {
  const variants: Record<DataRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
    COMPLETED: 'default',
    APPROVED: 'default',
    INITIATED: 'outline',
    AWAITING_CONSENT: 'secondary',
    VERIFIED: 'secondary',
    DELIVERED: 'secondary',
    DENIED: 'destructive',
    FAILED: 'destructive',
    EXPIRED: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status.replace(/_/g, ' ')}</Badge>;
};

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);

  const { data, isLoading, error, isFetching } = useGetAuditLogs({ ...filters, search: debouncedSearch });

  const handleFilterChange = (key: keyof AuditFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExport = () => {
    if (data?.data) {
      exportToExcel(data.data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Request Audit Trail</h1>
          <p className="text-muted-foreground">Monitor all data exchange transactions across the network.</p>
        </div>
        <div className="flex items-center gap-2">
            {isFetching && <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />}
            <Button onClick={handleExport} disabled={!data || data.data.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Use the filters below to narrow down the audit log results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID, Requester, Provider..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value, page: 1}))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loading text="" /></TableCell></TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No results found.</TableCell></TableRow>
                ) : (
                  data?.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id.split('-')[0]}...</TableCell>
                      <TableCell>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{log.requester.name}</TableCell>
                      <TableCell className="font-medium">{log.provider.name}</TableCell>
                      <TableCell className="font-mono text-xs">{log.dataSchema.schemaId}</TableCell>
                      <TableCell><StatusBadge status={log.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="py-4">
          {data && data.meta.total > 0 && (
            <PaginationControls 
              page={filters.page}
              totalPages={data.meta.totalPages}
              onPageChange={(page) => handleFilterChange('page', page)}
              totalItems={data.meta.total}
              limit={filters.limit}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
