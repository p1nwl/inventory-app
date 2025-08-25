import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const AUTH_URL = process.env.AUTH_URL || "http://localhost:3001";

app.use(
  cors({
    origin: `${FRONTEND_URL}`,
    credentials: true,
  })
);
app.use(express.json());

async function getSessionFromAuth(req: express.Request) {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(", ");
    }
  }

  try {
    const sessionRes = await fetch(`${AUTH_URL}/api/auth/session`, {
      headers,
    });

    if (!sessionRes.ok) return null;

    const session = await sessionRes.json();
    return session?.user ? session : null;
  } catch (err) {
    console.error("Failed to fetch session:", err);
    return null;
  }
}

// --- Users ---
app.post("/api/users", async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: "USER",
        language: "en",
        theme: "LIGHT",
      },
    });
    res.status(201).json(user);
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(409).json({ error: "User with this email already exists" });
    } else {
      res.status(400).json({ error: "Invalid data" });
    }
  }
});

app.get("/api/users/by-email", async (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// --- Inventories ---
app.get("/api/inventories", async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      include: {
        creator: { select: { name: true, email: true } },
      },
    });
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/inventories", async (req, res) => {
  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(", ");
      }
    }

    const sessionRes = await fetch(`${AUTH_URL}/api/auth/session`, {
      headers,
    });
    const session = await sessionRes.json();

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, description, category, tags, customIdFormat } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const inventory = await prisma.inventory.create({
      data: {
        title,
        description,
        category: "Equipment",
        tags: tags || [],
        customIdFormat: customIdFormat || [],
        version: 1,
        creatorId: session.user.id,
      },
    });

    res.status(201).json(inventory);
  } catch (e: any) {
    console.error("Create inventory error:", e);
    res.status(400).json({ error: "Invalid data" });
  }
});

app.get("/api/inventories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { creator: { select: { name: true, email: true } } },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    res.json(inventory);
  } catch (error) {
    console.error("Fetch inventory error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// --- Items ---
app.post("/api/items", async (req, res) => {
  const {
    inventoryId,
    customId,
    string1,
    int1,
    int2,
    int3,
    string2,
    string3,
    bool1,
    bool2,
    bool3,
  } = req.body;

  const session = await getSessionFromAuth(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: {
      creator: true,
      accessList: {
        where: { userId: session.user.id },
        select: { userId: true },
      },
    },
  });

  if (!inventory) {
    return res.status(404).json({ error: "Inventory not found" });
  }

  const hasAccess =
    inventory.creatorId === session.user.id ||
    inventory.accessList.length > 0 ||
    inventory.isPublic;

  if (!hasAccess) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const item = await prisma.item.create({
      data: {
        inventory: {
          connect: { id: inventoryId },
        },
        customId,
        string1,
        string2,
        string3,
        int1,
        int2,
        int3,
        bool1,
        bool2,
        bool3,
        createdBy: { connect: { id: session.user.id } },
        version: 1,
      },
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error("Create item error:", error);
    res.status(400).json({ error: "Invalid data" });
  }
});

app.get("/api/inventories/:id/items", async (req, res) => {
  const { id } = req.params;
  const session = await getSessionFromAuth(req);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      items: true,
      creator: true,
      accessList: { where: { userId: session.user.id } },
    },
  });

  if (!inventory) return res.status(404).json({ error: "Inventory not found" });

  const hasAccess =
    inventory.creatorId === session.user.id ||
    inventory.accessList.length > 0 ||
    inventory.isPublic;

  if (!hasAccess) return res.status(403).json({ error: "Access denied" });

  res.json(inventory.items);
});

app.get("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const session = await getSessionFromAuth(req);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          creator: true,
          accessList: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!item) return res.status(404).json({ error: "Item not found" });

  const inv = item.inventory;
  const hasAccess =
    inv.creatorId === session.user.id ||
    inv.accessList.length > 0 ||
    inv.isPublic;

  if (!hasAccess) return res.status(403).json({ error: "Access denied" });

  res.json(item);
});

// --- Profile ---
app.get("/api/profile", async (req, res) => {
  try {
    const session = await getSessionFromAuth(req);
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const myInventories = await prisma.inventory.findMany({
      where: { creatorId: session.user.id },
      include: { creator: true },
      orderBy: { updatedAt: "desc" },
    });

    const accessibleInventories = await prisma.inventory.findMany({
      where: {
        accessList: {
          some: { userId: session.user.id },
        },
      },
      include: { creator: true },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      myInventories,
      accessibleInventories,
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// --- Update Inventory ---
app.put("/api/inventories/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, category, tags, customIdFormat, version } =
    req.body;

  try {
    const current = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!current) return res.status(404).json({ error: "Inventory not found" });

    if (current.version !== version) {
      return res.status(409).json({
        error: "Conflict",
        message:
          "This inventory was modified by another user. Please refresh the page and try again",
        currentVersion: current.version,
        yourVersion: version,
      });
    }

    const updated = await prisma.inventory.update({
      where: {
        id_version: { id, version },
      },
      data: {
        title,
        description,
        category,
        tags,
        customIdFormat,
        version: version + 1,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(409).json({
        error: "Conflict",
        message: "Failed to update: inventory was modified by another user",
      });
    }
    res.status(400).json({ error: "Invalid data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
