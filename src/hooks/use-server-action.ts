'use client';

import { useState, useTransition } from 'react';

type ServerAction<T, U> = (payload: T) => Promise<{
  error?: U | { _form?: string[] };
  success?: boolean;
  message?: string;
  data?: any;
}>;

interface UseServerActionOptions<U> {
  onSuccess?: (data?: any) => void;
  onError?: (error: U | { _form?: string[] }) => void;
  onFinally?: () => void;
}

export const useServerAction = <T, U>(
  action: ServerAction<T, U>,
  options: UseServerActionOptions<U> = {}
) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<U | { _form?: string[] } | null>(null);
  const [data, setData] = useState<any | null>(null);

  const execute = async (payload: T) => {
    setError(null);
    setData(null);

    startTransition(async () => {
      const result = await action(payload);
      if (result.error) {
        setError(result.error);
        options.onError?.(result.error);
      }
      if (result.success) {
        setData(result.data);
        options.onSuccess?.(result.data);
      }
      options.onFinally?.();
    });
  };

  return {
    execute,
    isPending,
    error,
    data,
  };
};
