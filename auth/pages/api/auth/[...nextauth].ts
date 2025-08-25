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
console.log("✅ PrismaAdapter:", PrismaAdapter(prisma));
console.log(
  "🔐 NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Not set"
);

const adapter = PrismaAdapter(prisma);

const originalGetUserByAccount = adapter.getUserByAccount;
adapter.getUserByAccount = async (account) => {
  console.log("🔍 getUserByAccount called with:", account);
  const result = await originalGetUserByAccount(account);
  console.log("🔍 getUserByAccount result:", result);
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
    console.log("🔍 Found account:", account);
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
    callbacks: {
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
        console.log("🔑 Session callback:", { session, token });
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
