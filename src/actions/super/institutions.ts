'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InstitutionStatus } from '@/generated/prisma/client';

// Helper function for auth check
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== 'SUPER_USER') {
    throw new Error('Unauthorized');
  }
  return session;
}

// Zod Schema for validation
const institutionSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.string().cuid('A valid role must be selected'),
  apiEndpoint: z.string().url('Must be a valid URL'),
  publicKey: z.string().min(10, 'Public key is required'),
});

/**
 * Server Action to create or update an institution.
 * If `id` is provided, it updates; otherwise, it creates.
 */
export async function upsertInstitutionAction(formData: FormData) {
  await checkAuth();

  const data = {
    id: formData.get('id')?.toString(),
    name: formData.get('name')?.toString() ?? '',
    roleId: formData.get('roleId')?.toString() ?? '',
    apiEndpoint: formData.get('apiEndpoint')?.toString() ?? '',
    publicKey: formData.get('publicKey')?.toString() ?? '',
  };

  const validatedFields = institutionSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { id, ...rest } = validatedFields.data;
    if (id) {
      await prisma.institution.update({
        where: { id },
        data: rest,
      });
    } else {
      await prisma.institution.create({
        data: {
          ...rest,
        },
      });
    }
    revalidatePath('/super/dashboard/institutions');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: { _form: ['An unexpected error occurred.'] } };
  }
}

/**
 * Server Action to update the status of an institution.
 */
export async function updateInstitutionStatusAction(payload: {
  id: string;
  status: InstitutionStatus;
}) {
  await checkAuth();
  
  const { id, status } = payload;

  try {
    await prisma.institution.update({
      where: { id },
      data: { status },
    });
    revalidatePath('/super/dashboard/institutions');
    return { success: true, message: `Institution status updated to ${status}.` };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update status.' };
  }
}

/**
 * Server Action to delete an institution. (For completeness)
 */
export async function deleteInstitutionAction(id: string) {
    await checkAuth();

    try {
        await prisma.institution.delete({ where: { id } });
        revalidatePath('/super/dashboard/institutions');
        return { success: true, message: 'Institution deleted.' };
    } catch (error) {
        return { error: 'Failed to delete institution.' };
    }
}
