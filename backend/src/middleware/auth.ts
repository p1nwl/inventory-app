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

    const sessionRes = await fetch(
      `${process.env.AUTH_URL || "http://localhost:3001"}/api/auth/session`,
      {
        headers,
      }
    );

    if (sessionRes.ok) {
      const session = await sessionRes.json();
      if (session?.user) {
        req.user = {
          ...session.user,
          id: session.user.id,
          role: session.user.role || "USER",
        };
      } else {
        req.user = makeGuestUser();
      }
    } else {
      req.user = makeGuestUser();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    req.user = makeGuestUser();
  }

  next();
};

function makeGuestUser() {
  return {
    id: "guest",
    name: "Guest",
    email: "guest@example.com",
    role: "GUEST",
  };
}
