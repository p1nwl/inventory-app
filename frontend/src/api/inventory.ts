import type { Inventory, InventoryUserAccess } from "../types";
import { API_URL } from "../types";
import type { ConflictResponse } from "../types";
import { createConflictError } from "../types";

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
    let errorData: unknown = null;
    try {
      errorData = await res.json();
    } catch (error) {
      console.warn("Failed to parse error JSON:", error);
    }

    if (res.status === 409) {
      if (
        errorData &&
        typeof errorData === "object" &&
        "currentVersion" in errorData &&
        "yourVersion" in errorData
      ) {
        const typedErrorData = errorData as ConflictResponse;
        throw createConflictError(
          typedErrorData.currentVersion,
          typedErrorData.yourVersion,
          typedErrorData.message
        );
      } else {
        throw createConflictError(null, data.version || null);
      }
    }

    let errorMessage: string;
    if (
      errorData &&
      typeof errorData === "object" &&
      "message" in errorData &&
      typeof errorData.message === "string"
    ) {
      errorMessage = errorData.message;
    } else if (
      errorData &&
      typeof errorData === "object" &&
      "error" in errorData &&
      typeof errorData.error === "string"
    ) {
      errorMessage = errorData.error;
    } else {
      errorMessage = `Failed to update inventory: ${res.statusText}`;
    }

    throw new Error(errorMessage);
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

export const updatePublic = async (
  inventoryId: string,
  isPublic: boolean,
  version: number
): Promise<Inventory> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}/public`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isPublic, version }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const fetchAccessList = async (
  inventoryId: string
): Promise<InventoryUserAccess[]> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}/access`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const addAccess = async (
  inventoryId: string,
  email: string,
  accessLevel: "VIEWER" | "EDITOR"
): Promise<InventoryUserAccess[]> => {
  const res = await fetch(`${API_URL}/api/inventories/${inventoryId}/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, accessLevel }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateAccess = async (
  inventoryId: string,
  userId: string,
  accessLevel: "VIEWER" | "EDITOR"
): Promise<InventoryUserAccess> => {
  const res = await fetch(
    `${API_URL}/api/inventories/${inventoryId}/access/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accessLevel }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const removeAccess = async (
  inventoryId: string,
  userId: string
): Promise<void> => {
  const res = await fetch(
    `${API_URL}/api/inventories/${inventoryId}/access/${userId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error(await res.text());
};
