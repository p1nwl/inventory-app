type User = {
  id: string;
  role?: string;
};

type Inventory = {
  creatorId: string;
  isPublic: boolean;
  accessList: Array<{ userId: string; accessLevel: "VIEWER" | "EDITOR" }>;
  isReadOnly?: boolean;
};

export function canViewInventory(
  user: User | null,
  inventory: Inventory
): boolean {
  if (!user) return inventory.isPublic;
  if (user.role === "ADMIN") return true;

  return (
    inventory.isPublic ||
    inventory.creatorId === user.id ||
    inventory.accessList.some((a) => a.userId === user.id)
  );
}

export function canEdit(user: User | null, inventory: Inventory): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (inventory.creatorId === user.id) return true;

  return inventory.accessList.some(
    (a) => a.userId === user.id && a.accessLevel === "EDITOR"
  );
}

export function canEditItems(user: User | null, inventory: Inventory): boolean {
  if (!user) return false;

  return canEdit(user, inventory);
}
