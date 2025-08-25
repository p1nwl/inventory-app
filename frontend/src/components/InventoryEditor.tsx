import React, { useEffect, useState } from "react";
import type { Item, Inventory } from "../types";

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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/inventories/${inventoryId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const inv: Inventory = await response.json();
        setData(inv);
      } catch (err) {
        console.error("Error loading inventory:", err);
      }
    };

    fetchInventory();
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
    const fetchItems = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/inventories/${inventoryId}/items`,
          {
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
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [inventoryId]);

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
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  if (isConflict) {
    return (
      <div
        style={{
          background: "yellow",
          padding: "20px",
          margin: "10px 0",
          borderRadius: "4px",
        }}
      >
        <p>
          Another user has modified this inventory. Version conflict detected.
        </p>
        <button
          onClick={resolveConflict}
          style={{ padding: "8px 12px", cursor: "pointer" }}
        >
          Merge changes
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div>
        <h2>Edit Inventory</h2>
        <div>
          <label>
            Title:
            <input
              type="text"
              value={data.title}
              onChange={handleTitleChange}
              style={{ width: "100%", padding: "8px", margin: "4px 0" }}
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
              style={{ width: "100%", padding: "8px", margin: "4px 0" }}
            />
          </label>
        </div>
        <p>
          <small>Current version: {data.version}</small>
        </p>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3>Items</h3>
        <button
          onClick={handleAddItem}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          + Add Item
        </button>

        {loadingItems ? (
          <p>Loading items...</p>
        ) : (
          <table border={1} cellPadding="10" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Custom ID</th>
                <th>String 1</th>
                <th>Int 1</th>
                <th>Bool 1</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.customId}</td>
                  <td>{item.string1 || "-"}</td>
                  <td>{item.int1 || "-"}</td>
                  <td>{item.bool1 ? "✅" : "❌"}</td>
                  <td>{item.version}</td>
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
