import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Cors from "cors";
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id?: string;
    role?: string;
    theme?: string;
    language?: string;
  }

  interface Session extends DefaultSession {
    user?: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    theme?: string;
    language?: string;
  }
}

const prisma = new PrismaClient();
const cors = Cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

const adapter = PrismaAdapter(prisma);

const originalGetUserByAccount = adapter.getUserByAccount;
adapter.getUserByAccount = async (account) => {
  const result = await originalGetUserByAccount(account);
  return result;
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.query.debug === "account") {
    const account = await prisma.account.findFirst({
      where: { provider: "google" },
    });
    return res.json({ account });
  }

  return await NextAuth(req, res, {
    adapter,
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
    cookies: {
      sessionToken: {
        name: "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
      csrfToken: {
        name: "next-auth.csrf-token",
        options: {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
      callbackUrl: {
        name: "next-auth.callback-url",
        options: {
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
      state: {
        name: "next-auth.state",
        options: {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 900,
        },
      },
    },
    callbacks: {
      async signIn({ user }) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.name || "Anonymous",
              role: "USER",
              language: "en",
              theme: "LIGHT",
            },
          });
        }

        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.theme = user.theme;
          token.language = user.language;
        }
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (token) {
          session.user.id = token.id;
          session.user.role = token.role || "USER";
          session.user.theme = token.theme || "LIGHT";
          session.user.language = token.language || "en";
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        return process.env.FRONTEND_URL || baseUrl;
      },
    },
    events: {
      signOut: async () => {
        console.log("User signed out");
      },
    },
  });
}
