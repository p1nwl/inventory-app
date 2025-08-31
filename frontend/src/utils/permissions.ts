export type User = {
  id: string;
  role?: string;
};

export type Inventory = {
  id: string;
  creatorId: string;
  isPublic: boolean;
  accessList?: Array<{ userId: string; writeAccess?: boolean }>;
  isReadOnly?: boolean;
};

export function canViewInventory(
  user: User | null,
  inventory: Inventory
): boolean {
  if (!user || user.role === "GUEST") return inventory.isPublic;

  if (user.role === "ADMIN") {
    return true;
  }

  const hasAccess =
    inventory.accessList?.some((a) => a.userId === user.id) ?? false;

  return inventory.isPublic || inventory.creatorId === user.id || hasAccess;
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

  const hasWriteAccess =
    inventory.accessList?.some(
      (a) => a.userId === user.id && a.writeAccess === true
    ) ?? false;

  return (
    canEdit(user, inventory) ||
    (hasWriteAccess && !inventory.isReadOnly) ||
    (inventory.isPublic && !inventory.isReadOnly)
  );
}
