import type { Item } from "../types";
import { API_URL } from "../types";

export const fetchItems = async (inventoryId: string): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}/items`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch items: ${error}`);
  }

  return res.json();
};

export const addItem = async ({
  inventoryId,
  customId,
}: {
  inventoryId: string;
  customId: string;
}): Promise<Item> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      inventoryId,
      customId,
      string1: "",
      int1: 0,
      bool1: false,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to add item: ${error}`);
  }

  return res.json();
};

export const deleteItem = async (itemId: string): Promise<void> => {
  const res = await fetch(`${API_URL}/api/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to delete item: ${error}`);
  }
};

export const updateItem = async (
  itemId: string,
  data: Partial<Item>
): Promise<Item> => {
  const res = await fetch(`${API_URL}/api/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to update item: ${error}`);
  }

  return res.json();
};
