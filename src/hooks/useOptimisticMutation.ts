import { useQueryClient, useMutation, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticMutationConfig<TData, TVariables> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  // Function to optimistically update the cache before the mutation
  optimisticUpdate: (oldData: TData[] | undefined, variables: TVariables) => TData[];
  // Success message
  successMessage?: string;
  // Error message
  errorMessage?: string;
  // Additional query keys to invalidate
  invalidateKeys?: QueryKey[];
  // Callback on success
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * Hook for optimistic mutations with automatic rollback on error.
 * Updates the UI immediately while the mutation is in progress.
 */
export function useOptimisticMutation<TData, TVariables>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  successMessage,
  errorMessage = 'Erro ao realizar operação',
  invalidateKeys = [],
  onSuccess,
}: OptimisticMutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    // When mutate is called, optimistically update the cache
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update to the new value
      if (previousData !== undefined) {
        queryClient.setQueryData<TData[]>(queryKey, optimisticUpdate(previousData, variables));
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_error, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(errorMessage);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    onSuccess: (data, variables) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },
  });
}

/**
 * Helper to create optimistic add operation
 */
export function createOptimisticAdd<TData extends { id: string }>(
  newItem: Partial<TData>
): (oldData: TData[] | undefined, _variables: unknown) => TData[] {
  return (oldData) => {
    const tempItem = {
      ...newItem,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as TData;
    return oldData ? [...oldData, tempItem] : [tempItem];
  };
}

/**
 * Helper to create optimistic update operation
 */
export function createOptimisticUpdate<TData extends { id: string }>(
  id: string,
  updates: Partial<TData>
): (oldData: TData[] | undefined) => TData[] {
  return (oldData) => {
    if (!oldData) return [];
    return oldData.map((item) =>
      item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
    );
  };
}

/**
 * Helper to create optimistic delete operation
 */
export function createOptimisticDelete<TData extends { id: string }>(
  id: string
): (oldData: TData[] | undefined) => TData[] {
  return (oldData) => {
    if (!oldData) return [];
    return oldData.filter((item) => item.id !== id);
  };
}
