import type { Inventory } from "../types";
import { API_URL } from "../types";

export const fetchInventory = async (
  inventoryId: string
): Promise<Inventory> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch inventory: ${error}`);
  }

  return res.json();
};

export const updateInventory = async (
  inventoryId: string,
  data: Partial<Inventory>
): Promise<Inventory> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to update inventory: ${error}`);
  }

  return res.json();
};

export const fetchInventories = async (): Promise<Inventory[]> => {
  const res = await fetch(`${API_URL}/api/inventories`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch inventories: ${error}`);
  }

  return res.json();
};

export const createInventory = async ({
  title,
  description = "",
}: {
  title: string;
  description?: string;
}): Promise<Inventory> => {
  const res = await fetch(`${API_URL}/api/inventories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, description }),
  });

  if (!res.ok) throw new Error("Failed to create inventory");
  return res.json();
};
