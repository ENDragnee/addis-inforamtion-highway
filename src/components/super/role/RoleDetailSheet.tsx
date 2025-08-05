"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RoleWithDetails } from '@/hooks/use-roles';
import { format } from 'date-fns';
import { Users, Database, FileText } from 'lucide-react';

interface RoleDetailSheetProps {
  role: RoleWithDetails | null;
  onOpenChange: (open: boolean) => void;
}

export default function RoleDetailSheet({ role, onOpenChange }: RoleDetailSheetProps) {
  // If no role is selected, we render nothing. The `open` prop handles visibility.
  if (!role) {
    return null;
  }

  return (
    <Sheet open={!!role} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] p-0">
        <SheetHeader className="text-left bg-muted/50 p-6">
          <SheetTitle className="text-2xl">{role.name}</SheetTitle>
          <SheetDescription>{role.description}</SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 p-6">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
              <Users className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{role.institutionCount}</p>
              <p className="text-xs text-muted-foreground">Institution(s)</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
              <Database className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{role.dataSchemas.length}</p>
              <p className="text-xs text-muted-foreground">Schema(s)</p>
            </div>
          </div>

          {/* Associated Schemas List */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Authoritative Schemas
            </h3>
            <Separator />
            {role.dataSchemas.length > 0 ? (
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-3">
                {role.dataSchemas.map(schema => (
                  <div key={schema.id} className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50">
                    <FileText className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm font-medium">{schema.schemaId}</p>
                      <p className="text-xs text-muted-foreground">{schema.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center text-sm text-muted-foreground italic border-dashed border rounded-lg p-8">
                <p>No schemas are associated with this role.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Metadata */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Role created on {format(new Date(role.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
