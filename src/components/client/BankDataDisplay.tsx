'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Banknote, ShieldCheck } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface BankDataDisplayProps {
  user: { name: string, fin: string, avatarUrl: string };
  financialData: {
    providers: Array<{ name: string; balance: number; creditScore: number }>;
    aggregated: { totalBalance: number; averageCreditScore: number };
  };
  onReset: () => void;
}

export default function BankDataDisplay({ user, financialData, onReset }: BankDataDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">FIN: {user.fin}</p>
        </div>
        <Button variant="outline" size="icon" className="ml-auto" onClick={onReset}>
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">New Request</span>
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(financialData.aggregated.totalBalance)}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Avg. Credit Score</p>
          <p className="text-2xl font-bold">{financialData.aggregated.averageCreditScore}</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Data Breakdown by Institution</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Credit Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialData.providers.map(provider => (
              <TableRow key={provider.name}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(provider.balance)}</TableCell>
                <TableCell className="text-right font-medium">{provider.creditScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
