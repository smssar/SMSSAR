import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { AuthError } from "@auth/core/errors";
import { prisma } from "@/lib/prisma";
import { ensureFreePlan } from "@/lib/ensure-free-plan";

declare module "next-auth" {
  interface User {
    role: "USER" | "SELLER" | "SMSSAR" | "ADMIN";
    planId: string;
    image?: string | null;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "USER" | "SELLER" | "SMSSAR" | "ADMIN";
      planId: string;
      phone: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "SELLER" | "SMSSAR" | "ADMIN";
    planId?: string;
    picture?: string | null;
    phone?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  logger: {
    error(error) {
      if (
        (error instanceof AuthError && error.type === "CredentialsSignin") ||
        error.name === "JWTSessionError"
      ) {
        return;
      }

      const name = error instanceof AuthError ? error.type : error.name;
      console.error(`[auth][error] ${name}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    },
  },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }
        if (!user.emailVerified) {
          return null;
        }
        if (!user.passwordHash) {
          return null;
        }
        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          planId: user.planId ?? "plan_free",
          image: user.avatar,
          phone: user.phone,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (!email) {
        return false;
      }

      await ensureFreePlan();

      let dbUser = await prisma.user.findUnique({ where: { email } });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: user.name,
            email,
            avatar: user.image,
            role: "USER",
            status: "ACTIVE",
            planId: "plan_free",
            emailVerified: new Date(),
          },
        });
      } else if (!dbUser.emailVerified) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            emailVerified: new Date(),
            planId: dbUser.planId ?? "plan_free",
          },
        });
      } else if (!dbUser.planId) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { planId: "plan_free" },
        });
      }

      if (account.providerAccountId) {
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            userId: dbUser.id,
            access_token:
              typeof account.access_token === "string"
                ? account.access_token
                : null,
            refresh_token:
              typeof account.refresh_token === "string"
                ? account.refresh_token
                : null,
            token_type:
              typeof account.token_type === "string"
                ? account.token_type
                : null,
            scope: typeof account.scope === "string" ? account.scope : null,
            id_token:
              typeof account.id_token === "string" ? account.id_token : null,
            session_state:
              typeof account.session_state === "string"
                ? account.session_state
                : null,
            expires_at:
              typeof account.expires_at === "number"
                ? account.expires_at
                : null,
          },
          create: {
            userId: dbUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token:
              typeof account.access_token === "string"
                ? account.access_token
                : null,
            refresh_token:
              typeof account.refresh_token === "string"
                ? account.refresh_token
                : null,
            token_type:
              typeof account.token_type === "string"
                ? account.token_type
                : null,
            scope: typeof account.scope === "string" ? account.scope : null,
            id_token:
              typeof account.id_token === "string" ? account.id_token : null,
            session_state:
              typeof account.session_state === "string"
                ? account.session_state
                : null,
            expires_at:
              typeof account.expires_at === "number"
                ? account.expires_at
                : null,
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.planId = dbUser.planId ?? "plan_free";
          token.picture = dbUser.avatar;
          token.email = dbUser.email ?? token.email;
          token.phone = dbUser.phone ?? token.phone;
          return token;
        }
      }

      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        const dbUser = await prisma.user.findUnique({ where: { email } });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.planId = dbUser.planId ?? "plan_free";
          token.picture = dbUser.avatar;
          token.phone = dbUser.phone ?? token.phone;
        }
      } else if (token.email && (!token.id || !token.role || !token.planId)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.planId = dbUser.planId ?? "plan_free";
          token.picture = dbUser.avatar;
          token.phone = dbUser.phone ?? token.phone;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string" ? token.id : String(token.sub ?? "");
        session.user.role = (token.role ?? "USER") as
          | "USER"
          | "SELLER"
          | "SMSSAR"
          | "ADMIN";
        session.user.planId =
          typeof token.planId === "string" ? token.planId : "plan_free";
        session.user.image =
          typeof token.picture === "string"
            ? token.picture
            : session.user.image;
        session.user.phone =
          typeof token.phone === "string" ? token.phone : session.user.phone;
      }
      return session;
    },
  },
});
