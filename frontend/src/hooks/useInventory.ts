import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInventory, updateInventory } from "../api/inventory";
import type { Inventory } from "../types";

export const useInventory = (inventoryId: string) => {
  const queryClient = useQueryClient();

  const {
    data: inventory,
    isLoading: loadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventory", inventoryId],
    queryFn: () => fetchInventory(inventoryId),
    enabled: !!inventoryId,
  });

  const updateInventoryMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) => {
      return updateInventory(inventoryId, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["inventory", inventoryId], updated);
    },
    onError: (error: { message?: string; response?: { data: Inventory } }) => {
      console.error("[useInventory] update error:", error);
    },
  });

  return {
    inventory,
    loadingInventory,
    inventoryError,
    updateInventory: updateInventoryMutation.mutate,
    updateInventoryAsync: updateInventoryMutation.mutateAsync,
    isUpdating: updateInventoryMutation.isPending,
  };
};
