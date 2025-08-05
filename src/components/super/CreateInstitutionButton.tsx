'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstitutionForm } from './InstitutionForm'; // We'll create this next
import { Role } from '@/generated/prisma/client';

interface CreateInstitutionButtonProps {
  roles: Role[];
}

export function CreateInstitutionButton({ roles }: CreateInstitutionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Institution
      </Button>
      <InstitutionForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        roles={roles}
      />
    </>
  );
}
