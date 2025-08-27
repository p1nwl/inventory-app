import React, { useEffect, useState } from "react";
import type { Item, Inventory } from "../types";
import { useLocalStorageWithUser } from "../hooks/useLocalStorageWithUser";
import { useAuth } from "../hooks/useAuth";

interface InventoryEditorProps {
  inventoryId: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const InventoryEditor = ({
  inventoryId,
}: InventoryEditorProps): React.JSX.Element => {
  const [data, setData] = useState<Partial<Inventory>>({
    id: inventoryId,
    title: "",
    description: "",
    version: 1,
    updatedAt: "",
  });

  const [isConflict, setIsConflict] = useState<boolean>(false);
  const [latestData, setLatestData] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const { save } = useLocalStorageWithUser();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    const fetchInventory = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/inventories/${inventoryId}`,
          {
            signal: controller.signal,
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const inv: Inventory = await response.json();

        if (!controller.signal.aborted) {
          setData(inv);
        }
      } catch (err) {
        console.error("Error loading inventory:", err);
      }
    };

    fetchInventory();

    return () => controller.abort();
  }, [inventoryId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/inventories/${inventoryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: data.title,
              description: data.description,
              version: data.version,
            }),
            credentials: "include",
          }
        );

        if (response.status === 409) {
          const freshData: Inventory = await fetch(
            `${API_URL}/api/inventories/${inventoryId}`,
            { credentials: "include" }
          ).then((r) => r.json());
          setLatestData(freshData);
          setIsConflict(true);
        } else if (response.ok) {
          const updated: Inventory = await response.json();
          setData((prev) => ({
            ...prev,
            version: updated.version,
          }));
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [data, inventoryId]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/inventories/${inventoryId}/items`,
          {
            signal: controller.signal,
            credentials: "include",
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch items:", await res.text());
          return;
        }

        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        if (!controller.signal.aborted) setLoadingItems(false);
      }
    };

    fetchItems();

    return () => controller.abort();
  }, [inventoryId]);

  if (authLoading) {
    return <div className="p-5 text-center">Loading session...</div>;
  }

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
  };

  const handleAddItem = async () => {
    const customId = prompt("Enter item ID:");
    if (!customId) return;

    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          inventoryId,
          customId,
          string1: "New Item",
          int1: 0,
          bool1: false,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to add item: ${error}`);
      }

      const newItem = await res.json();
      setItems((prev) => [newItem, ...prev]);
      alert(`Item "${customId}" added successfully!`);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error adding item:", error);
        alert("Failed to add item. Please try again.");
      }
    }
  };

  const handleItemClick = (id: string) => {
    save("lastInventoryId", id);
  };

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
          className="px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer mb-5"
        >
          + Add Item
        </button>

        {loadingItems ? (
          <p>Loading items...</p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-2.5 py-3 text-left">ID</th>
                <th className="px-2.5 py-3 text-left">Custom ID</th>
                <th className="px-2.5 py-3 text-left">String 1</th>
                <th className="px-2.5 py-3 text-left">Int 1</th>
                <th className="px-2.5 py-3 text-left">Bool 1</th>
                <th className="px-2.5 py-3 text-left">Version</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick(inventoryId)}
                  className="cursor-pointer transition-colors duration-150 hover:bg-gray-50 hover:shadow-[inset_0_0_5px_rgba(0,0,0,0.1)]"
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
