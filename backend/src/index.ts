import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./middleware/auth";
import { canViewInventory, canEdit, canEditItems } from "./utils/permissions";
import type { User } from "./types";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: `${FRONTEND_URL}`,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

app.get("/api/inventories", authenticate, async (req, res) => {
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  try {
    const inventories = await prisma.inventory.findMany({
      include: {
        creator: { select: { name: true, email: true } },
        accessList: true,
      },
    });

    const result = inventories
      .filter((inv) => canViewInventory(user, inv))
      .map((inv) => ({
        ...inv,
        permissions: {
          canView: true,
          canEdit: canEdit(user, inv),
          canEditItems: canEditItems(user, inv),
        },
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/inventories", authenticate, async (req, res) => {
  const userId = req.user!.id;
  const { title, description, tags, customIdFormat } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const inventory = await prisma.inventory.create({
      data: {
        title,
        description,
        category: "Equipment",
        tags: tags || [],
        customIdFormat: customIdFormat || [],
        version: 1,
        creatorId: userId,
      },
    });

    res.status(201).json({
      ...inventory,
      permissions: {
        canView: true,
        canEdit: true,
        canEditItems: true,
      },
    });
  } catch (e: any) {
    console.error("Create inventory error:", e);
    res.status(400).json({ error: "Invalid data" });
  }
});

app.get("/api/inventories/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        creator: true,
        accessList: true,
      },
    });

    if (!inventory) return res.status(404).json({ error: "Not found" });
    if (!canViewInventory(user, inventory))
      return res.status(403).json({ error: "Access denied" });

    res.json({
      ...inventory,
      permissions: {
        canView: true,
        canEdit: canEdit(user, inventory),
        canEditItems: canEditItems(user, inventory),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/inventories/:id/items", authenticate, async (req, res) => {
  const { id: inventoryId } = req.params;
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: {
      creator: true,
      accessList: true,
    },
  });

  if (!inventory) return res.status(404).json({ error: "Inventory not found" });
  if (!canEditItems(user, inventory))
    return res.status(403).json({ error: "Access denied" });

  try {
    const item = await prisma.item.create({
      data: {
        inventory: { connect: { id: inventoryId } },
        customId: req.body.customId,
        string1: req.body.string1,
        string2: req.body.string2,
        string3: req.body.string3,
        int1: req.body.int1,
        int2: req.body.int2,
        int3: req.body.int3,
        bool1: req.body.bool1,
        bool2: req.body.bool2,
        bool3: req.body.bool3,
        createdBy: { connect: { id: user!.id } },
        version: 1,
      },
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error("Create item error:", error);
    res.status(400).json({ error: "Invalid data" });
  }
});

app.get("/api/inventories/:id/items", authenticate, async (req, res) => {
  const { id } = req.params;
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      items: true,
      creator: true,
      accessList: true,
    },
  });

  if (!inventory) return res.status(404).json({ error: "Inventory not found" });

  if (!canViewInventory(user, inventory))
    return res.status(403).json({ error: "Access denied" });

  res.json({
    items: inventory.items,
    permissions: {
      canView: true,
      canEdit: canEdit(user, inventory),
      canEditItems: canEditItems(user, inventory),
    },
  });
});

app.put(
  "/api/inventories/:id/items/:itemId",
  authenticate,
  async (req, res) => {
    const { id: inventoryId, itemId } = req.params;
    const user = req.user ? { id: req.user.id, role: req.user.role } : null;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { accessList: true },
    });

    if (!inventory)
      return res.status(404).json({ error: "Inventory not found" });
    if (!canEditItems(user, inventory))
      return res.status(403).json({ error: "Access denied" });

    try {
      const item = await prisma.item.update({
        where: { id: itemId },
        data: {
          customId: req.body.customId,
          string1: req.body.string1,
          int1: req.body.int1,
          bool1: req.body.bool1,
          version: { increment: 1 },
        },
      });

      res.json(item);
    } catch (error: any) {
      console.error("Update item error:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  }
);

app.get("/api/items/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          creator: true,
          accessList: true,
        },
      },
    },
  });

  if (!item) return res.status(404).json({ error: "Item not found" });

  if (!canViewInventory(user, item.inventory))
    return res.status(403).json({ error: "Access denied" });

  res.json({
    ...item,
    permissions: {
      canView: true,
      canEdit: canEdit(user, item.inventory),
      canEditItems: canEditItems(user, item.inventory),
    },
  });
});

app.get("/api/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const myInventories = await prisma.inventory.findMany({
      where: { creatorId: userId },
      include: { creator: true, accessList: true },
      orderBy: { updatedAt: "desc" },
    });

    const accessibleInventories = await prisma.inventory.findMany({
      where: {
        accessList: {
          some: { userId },
        },
      },
      include: { creator: true, accessList: true },
      orderBy: { updatedAt: "desc" },
    });

    const profileData = {
      myInventories: myInventories.map((inv) => ({
        ...inv,
        permissions: {
          canView: true,
          canEdit: canEdit({ id: userId, role: req.user!.role }, inv),
          canEditItems: canEditItems({ id: userId, role: req.user!.role }, inv),
        },
      })),
      accessibleInventories: accessibleInventories.map((inv) => ({
        ...inv,
        permissions: {
          canView: true,
          canEdit: canEdit({ id: userId, role: req.user!.role }, inv),
          canEditItems: canEditItems({ id: userId, role: req.user!.role }, inv),
        },
      })),
    };

    res.json(profileData);
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/inventories/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;

  try {
    const current = await prisma.inventory.findUnique({
      where: { id },
      include: {
        accessList: true,
      },
    });

    if (!current) return res.status(404).json({ error: "Inventory not found" });

    if (!canEdit(user, current)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (current.version !== req.body.version) {
      return res.status(409).json({
        error: "Conflict",
        message:
          "This inventory was modified by another user. Please refresh the page and try again",
        currentVersion: current.version,
        yourVersion: req.body.version,
      });
    }

    const updated = await prisma.inventory.update({
      where: { id_version: { id, version: req.body.version } },
      data: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags,
        customIdFormat: req.body.customIdFormat,
        version: req.body.version + 1,
      },
      include: {
        accessList: true,
      },
    });

    res.json({
      ...updated,
      permissions: {
        canView: true,
        canEdit: canEdit(user, updated),
        canEditItems: canEditItems(user, updated),
      },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(409).json({
        error: "Conflict",
        message: "Failed to update: inventory was modified by another user",
      });
    }
    console.error("Update inventory error:", error);
    res.status(400).json({ error: "Invalid data" });
  }
});

app.delete(
  "/api/inventories/:id/items/:itemId",
  authenticate,
  async (req, res) => {
    const { id: inventoryId, itemId } = req.params;
    const user = req.user ? { id: req.user.id, role: req.user.role } : null;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { accessList: true },
    });

    if (!inventory)
      return res.status(404).json({ error: "Inventory not found" });
    if (!canEditItems(user, inventory))
      return res.status(403).json({ error: "Access denied" });

    try {
      await prisma.item.delete({
        where: { id: itemId },
      });

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete item error:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
