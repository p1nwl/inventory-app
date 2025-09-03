import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchItems, addItem, updateItem } from "../api/items";
import type { Item } from "../types";

export const useItems = (inventoryId: string) => {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading: loadingItems,
    error: itemsError,
  } = useQuery({
    queryKey: ["items", inventoryId],
    queryFn: () => fetchItems(inventoryId),
    enabled: !!inventoryId,
  });

  const addMutation = useMutation({
    mutationFn: ({ customId }: { customId: string }) =>
      addItem({ inventoryId, customId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", inventoryId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      inventoryId,
      itemId,
      data,
    }: {
      inventoryId: string;
      itemId: string;
      data: Partial<Item>;
    }) => {
      return updateItem(inventoryId, itemId, data);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(["items", inventoryId], (old: Item[] = []) =>
        old.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    },
  });

  return {
    items,
    loadingItems,
    itemsError,
    addItem: addMutation.mutate,
    isAdding: addMutation.isPending,
    updateItem: updateItemMutation.mutate,
    isUpdatingItem: updateItemMutation.isPending,
  };
};
