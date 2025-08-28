import React, { useEffect, useState } from "react";
import type { Inventory } from "../types";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInventory, updateInventory } from "../api/inventory";
import { useQuery } from "@tanstack/react-query";
import { addItem, fetchItems } from "../api/items";

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
    version: 1,
    updatedAt: "",
  });

  const {
    data: inventory,
    isLoading: loadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ["inventory", inventoryId],
    queryFn: () => fetchInventory(inventoryId),
    enabled: !!inventoryId,
  });

  const {
    data: items = [],
    isLoading: loadingItems,
    error: itemsError,
  } = useQuery({
    queryKey: ["items", inventoryId],
    queryFn: () => fetchItems(inventoryId),
    enabled: !!inventoryId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) =>
      updateInventory(inventoryId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["inventory", inventoryId], updated);
      setData(updated);
    },
    onError: (error: { message?: string; response?: { data: Inventory } }) => {
      if (error.message?.includes("409")) {
        setIsConflict(true);
        setLatestData(error.response?.data || null);
      } else {
        alert("Failed to save. Please try again.");
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ customId }: { customId: string }) =>
      addItem({ inventoryId, customId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", inventoryId] });
    },
    onError: () => {
      alert("Failed to add item. Please try again.");
    },
  });

  useEffect(() => {
    if (inventory) {
      setData(inventory);
    }
  }, [inventory]);

  useEffect(() => {
    if (!data || !inventory) return;

    const timer = setTimeout(() => {
      if (data.version === inventory.version) {
        updateMutation.mutate(data);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [data, inventory, updateMutation, inventoryId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, title: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setData({ ...data, description: e.target.value });
  };

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

  const handleItemClick = () => {
    save("lastInventoryId", inventoryId);
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
    <div className="p-5 font-sans" style={{ fontFamily: "Arial, sans-serif" }}>
      <div>
        <h2 className="text-xl font-semibold">Edit Inventory</h2>
        <div>
          <label>
            Title:
            <input
              type="text"
              value={data.title}
              onChange={handleTitleChange}
              className="w-full px-2 py-2 mt-1 mb-1 border border-gray-300 rounded"
            />
          </label>
        </div>
        <div>
          <label>
            Description:
            <textarea
              value={data.description ?? ""}
              onChange={handleDescriptionChange}
              rows={4}
              className="w-full px-2 py-2 mt-1 mb-1 border border-gray-300 rounded"
            />
          </label>
        </div>
        <p>
          <small className="text-gray-600">
            Current version: {data.version}
          </small>
        </p>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-medium">Items</h3>
        <button
          onClick={handleAddItem}
          disabled={addMutation.isPending}
          className="px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer mb-5 disabled:opacity-50"
        >
          {addMutation.isPending ? "Adding..." : "+ Add Item"}
        </button>

        {loadingItems ? (
          <p>Loading items...</p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-2.5 py-3">ID</th>
                <th className="px-2.5 py-3">Custom ID</th>
                <th className="px-2.5 py-3">String 1</th>
                <th className="px-2.5 py-3">Int 1</th>
                <th className="px-2.5 py-3">Bool 1</th>
                <th className="px-2.5 py-3">Version</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick}
                  className="cursor-pointer transition-colors duration-150 hover:bg-gray-500 hover:shadow-[inset_0_0_5px_rgba(0,0,0,0.1)]"
                >
                  <td className="px-2 py-1.5">{item.id.slice(0, 8)}...</td>
                  <td className="px-2 py-1.5">{item.customId}</td>
                  <td className="px-2 py-1.5">{item.string1 || "-"}</td>
                  <td className="px-2 py-1.5">{item.int1 || "-"}</td>
                  <td className="px-2 py-1.5 text-center">
                    {item.bool1 ? "✅" : "❌"}
                  </td>
                  <td className="px-2 py-1.5">{item.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InventoryEditor;
