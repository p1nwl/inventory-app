import React, { useEffect, useState } from "react";

interface Inventory {
  id: string;
  title: string;
  description: string;
  version: number;
  updatedAt: string;
}

interface InventoryEditorProps {
  inventoryId: string;
}

const InventoryEditor = ({
  inventoryId,
}: InventoryEditorProps): React.JSX.Element => {
  const [data, setData] = useState<Inventory>({
    id: inventoryId,
    title: "",
    description: "",
    version: 1,
    updatedAt: "",
  });

  const [isConflict, setIsConflict] = useState<boolean>(false);
  const [latestData, setLatestData] = useState<Inventory | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/inventories/${inventoryId}`,
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
          `http://localhost:3000/api/inventories/${inventoryId}`,
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
            `/api/inventories/${inventoryId}`
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
            value={data.description}
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
  );
};

export default InventoryEditor;
