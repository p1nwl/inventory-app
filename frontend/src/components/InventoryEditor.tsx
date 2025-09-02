import React, { useEffect, useState, useRef } from "react";
import type { Inventory } from "../types";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInventory, updateInventory } from "../api/inventory";
import { useQuery } from "@tanstack/react-query";
import { addItem, fetchItems, updateItem } from "../api/items";
import { EditableHeader } from "./EditableHeader";
import type { Item } from "../types";
import { ItemModal } from "./ItemModal";

interface InventoryEditorProps {
  inventoryId: string;
}

const InventoryEditor = ({
  inventoryId,
}: InventoryEditorProps): React.JSX.Element => {
  const { save } = useLocalStorageWithUser();
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isConflict, setIsConflict] = useState(false);
  const [latestData, setLatestData] = useState<Inventory | null>(null);
  const [data, setData] = useState<Partial<Inventory>>({
    id: inventoryId,
    title: "",
    description: "",
    updatedAt: "",
  });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const isEditingRef = useRef(false);

  const {
    data: inventory,
    isLoading: loadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventory", inventoryId],
    queryFn: () => fetchInventory(inventoryId),
    enabled: !!inventoryId,
  });

  const { data: items = [], error: itemsError } = useQuery({
    queryKey: ["items", inventoryId],
    queryFn: () => fetchItems(inventoryId),
    enabled: !!inventoryId,
  });

  const updateInventoryMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) => {
      return updateInventory(inventoryId, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["inventory", inventoryId], updated);
      setData((prev) => ({
        ...prev,
        ...updated,
        title: prev.title,
        description: prev.description,
        permissions: prev.permissions ?? updated.permissions,
      }));
    },
    onError: (error: { message?: string; response?: { data: Inventory } }) => {
      console.error("[InventoryEditor] update error:", error);
      if (error.message?.includes("409")) {
        setIsConflict(true);
        setLatestData(error.response?.data || null);
      } else {
        alert("Failed to save. Please try again.");
      }
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
    onError: () => {
      alert("Failed to save item. Please try again.");
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ customId }: { customId: string }) =>
      addItem({ inventoryId, customId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", inventoryId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      alert("Failed to add item. Please try again.");
    },
  });

  useEffect(() => {
    if (inventory) {
      setData((prev) => {
        return {
          ...inventory,
          title: prev.title || inventory.title,
          description: prev.description || inventory.description,
          permissions: inventory.permissions,
          version: inventory.version,
        };
      });
    }
  }, [inventory]);

  const canEdit = !!inventory?.permissions?.canEdit;
  const canEditItems = !!inventory?.permissions?.canEditItems;

  useEffect(() => {
    if (!canEdit) return;
    const interval = setInterval(() => {
      if (!isEditingRef.current && data?.id) {
        updateInventoryMutation.mutate(data);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [data, canEdit, updateInventoryMutation]);

  const resolveConflict = () => {
    if (!latestData) return;

    setData((prev) => ({
      ...latestData,
      title: prev.title,
      description: prev.description,
    }));
    setIsConflict(false);
    setLatestData(null);
  };

  const handleAddItem = () => {
    const customId = prompt("Enter item ID:");
    if (customId) {
      addMutation.mutate({ customId });
    }
  };

  const handleItemClick = (item: Item) => {
    save("lastInventoryId", inventoryId);
    setSelectedItem(item);
  };

  const handleItemSave = (updatedData: Partial<Item>) => {
    updateItemMutation.mutate({
      inventoryId,
      itemId: selectedItem!.id,
      data: updatedData,
    });
  };

  if (authLoading || loadingInventory) {
    return <div className="p-5 text-center">Loading inventory...</div>;
  }

  if (inventoryError || !inventory) {
    return <div className="p-5 text-red-600">Failed to load inventory</div>;
  }

  if (itemsError) {
    console.error("Failed to load items:", itemsError);
  }

  if (isConflict) {
    return (
      <div className="bg-yellow-300 p-5 my-2.5 rounded-md">
        <p>
          Another user has modified this inventory. Version conflict detected.
        </p>
        <button onClick={resolveConflict} className="px-3 py-2 cursor-pointer">
          Merge changes
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto">
      <EditableHeader
        title={data.title || ""}
        description={data.description ?? ""}
        canEdit={canEdit}
        onSave={({ title, description }) => {
          const newData = { ...data, title, description };
          setData(newData);
          updateInventoryMutation.mutate(newData);
        }}
        onEditingChange={(editing) => (isEditingRef.current = editing)}
      />

      <p className="text-sm text-gray-500 mb-6">Version: {data.version}</p>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Items</h3>
          {canEditItems && (
            <button
              onClick={handleAddItem}
              disabled={addMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-70"
            >
              {addMutation.isPending ? "Adding..." : "+ Add Item"}
            </button>
          )}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-500">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Custom ID</th>
              <th className="px-3 py-2">String 1</th>
              <th className="px-3 py-2">Int 1</th>
              <th className="px-3 py-2">Bool 1</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="hover:bg-gray-600 cursor-pointer"
              >
                <td className="px-3 py-2 text-xs text-gray-500">
                  {item.id.slice(0, 8)}...
                </td>
                <td className="px-3 py-2">{item.customId}</td>
                <td className="px-3 py-2">{item.string1 || "-"}</td>
                <td className="px-3 py-2">{item.int1 || "-"}</td>
                <td className="px-3 py-2 text-center">
                  {item.bool1 ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ItemModal
          item={selectedItem || ({} as Item)}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleItemSave}
          canEdit={canEditItems}
        />
      </div>
    </div>
  );
};

export default InventoryEditor;
