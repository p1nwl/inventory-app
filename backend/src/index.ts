import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

    const sessionRes = await fetch("http://localhost:3001/api/auth/session", {
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
        category,
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
        id_version: {
          id,
          version,
        },
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
