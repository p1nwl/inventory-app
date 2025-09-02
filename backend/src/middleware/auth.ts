import { Request, Response, NextFunction } from "express";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(", ");
      }
    }

    const sessionRes = await fetch(`${process.env.AUTH_URL}/api/auth/session`, {
      headers,
    });

    if (sessionRes.ok) {
      const session = await sessionRes.json();
      if (session?.user) {
        req.user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "USER",
          theme: session.user.theme || "LIGHT",
          language: session.user.language || "en",
        };
      }
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }

  next();
};
