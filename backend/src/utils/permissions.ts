type User = {
  id: string;
  role?: string;
};

type Inventory = {
  creatorId: string;
  isPublic: boolean;
  accessList: Array<{ userId: string; writeAccess?: boolean }>;
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

export function canViewItems(
  _user: User | null,
  _inventory: Inventory
): boolean {
  return true;
}

export function canEdit(user: User | null, inventory: Inventory): boolean {
  if (!user) return false;

  return inventory.creatorId === user.id || user.role === "ADMIN";
}

export function canEditItems(user: User | null, inventory: Inventory): boolean {
  if (!user) return false;

  return (
    canEdit(user, inventory) ||
    (inventory.accessList.some((a) => a.userId === user.id && a.writeAccess) &&
      !inventory.isReadOnly) ||
    (inventory.isPublic && !inventory.isReadOnly)
  );
}
