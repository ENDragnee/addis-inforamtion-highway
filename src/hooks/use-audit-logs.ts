import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DataRequest, Institution, DataSchema, DataRequestStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
// THE FIX: Import the `keepPreviousData` function from TanStack Query
import { keepPreviousData } from '@tanstack/react-query';

// --- Type Definitions ---
export type AuditLog = DataRequest & {
  requester: Pick<Institution, 'name'>;
  provider: Pick<Institution, 'name'>;
  dataSchema: Pick<DataSchema, 'schemaId'>;
};

type PaginatedAuditLogs = {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AuditFilters = {
  page: number;
  limit: number;
  search: string;
  status: DataRequestStatus | 'all';
};

// --- API Functions ---
const fetchAuditLogs = async (filters: AuditFilters): Promise<PaginatedAuditLogs> => {
  const { data } = await axios.get('/api/v1/super/audit-logs', {
    params: filters,
  });
  return data;
};

// --- React Query Hook ---
export const useGetAuditLogs = (filters: AuditFilters) => {
  return useQuery<PaginatedAuditLogs, Error>({
    queryKey: ['auditLogs', filters],
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: keepPreviousData,
  });
};

// --- Export Utility ---
export const exportToExcel = (data: AuditLog[], fileName: string = 'audit-log') => {
  const worksheetData = data.map(log => ({
    'Request ID': log.id,
    'Timestamp': format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    'Requester': log.requester.name,
    'Provider': log.provider.name,
    'Schema': log.dataSchema.schemaId,
    'Status': log.status,
    'Failure Reason': log.failureReason || 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
  XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
