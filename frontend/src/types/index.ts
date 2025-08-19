export type Role = "USER" | "ADMIN";
export type Theme = "LIGHT" | "DARK";

export interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  emailVerified?: string | null;
  role: Role;
  language: string;
  theme: Theme;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: Role;
  theme: Theme;
  language: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

export interface Inventory {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  isPublic: boolean;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  customIdFormat: string[];

  stringField1Name?: string | null;
  stringField1Active: boolean;
  stringField2Name?: string | null;
  stringField2Active: boolean;
  stringField3Name?: string | null;
  stringField3Active: boolean;

  intField1Name?: string | null;
  intField1Active: boolean;
  intField2Name?: string | null;
  intField2Active: boolean;
  intField3Name?: string | null;
  intField3Active: boolean;

  boolField1Name?: string | null;
  boolField1Active: boolean;
  boolField2Name?: string | null;
  boolField2Active: boolean;
  boolField3Name?: string | null;
  boolField3Active: boolean;
}

export interface Item {
  id: string;
  inventoryId: string;
  customId: string;
  version: number;
  createdAt: string;
  createdById: string;

  string1?: string | null;
  string2?: string | null;
  string3?: string | null;
  int1?: number | null;
  int2?: number | null;
  int3?: number | null;
  bool1?: boolean | null;
  bool2?: boolean | null;
  bool3?: boolean | null;
}

export interface InventoryUserAccess {
  id: string;
  inventoryId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  inventoryId?: string | null;
  itemId?: string | null;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface InventoryStats {
  id: string;
  inventoryId: string;
  itemCount: number;
  avgInt1?: number | null;
  avgInt2?: number | null;
  avgInt3?: number | null;
}
