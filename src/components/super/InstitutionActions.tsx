'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Institution, Role, InstitutionStatus } from '@/generated/prisma/client';
import toast from 'react-hot-toast';
import { useServerAction } from '@/hooks/use-server-action';
import { InstitutionForm } from './InstitutionForm';
import { updateInstitutionStatusAction } from '@/actions/super/institutions';

// Define a clear type for the props to resolve ambiguity
export type FullInstitution = Institution & { role: Role };

interface InstitutionActionsProps {
  institution: FullInstitution;
  roles: Role[];
  upsertAction: (formData: FormData) => Promise<any>;
}

export function InstitutionActions({ institution, roles, upsertAction }: InstitutionActionsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // THE FIX: The `updateInstitutionStatusAction` now has the correct signature for the hook.
  const { execute: executeStatusUpdate } = useServerAction(updateInstitutionStatusAction, {
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(typeof error === 'string' ? error : 'An error occurred'),
  });

  const handleStatusChange = (status: InstitutionStatus) => {
    // THE FIX: We now pass a single object payload to the execute function.
    executeStatusUpdate({ id: institution.id, status });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {institution.status === 'ACTIVE' ? (
            <DropdownMenuItem onSelect={() => handleStatusChange('SUSPENDED')} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => handleStatusChange('ACTIVE')}>
              <Undo2 className="mr-2 h-4 w-4" /> Reactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* THE FIX: The `institution` prop now has a consistent, well-defined type. */}
      <InstitutionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        institution={institution}
        roles={roles}
      />
    </>
  );
}
