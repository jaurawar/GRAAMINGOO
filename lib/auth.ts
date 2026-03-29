import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { cacheOTP, getOTP, deleteOTP } from "@/lib/redis";

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP expiry in ms (10 minutes)
export const OTP_EXPIRY_MS = 10 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const phone = credentials.phone.trim();
        const otp = credentials.otp.trim();

        // ── DEV BYPASS ────────────────────────────────────────────────────────
        // Any phone number + OTP "1234" creates a dummy session without
        // hitting Redis or the database. Remove this block before production.
        if (otp === "1234" && process.env.APP_ENV === "development") {
          return {
            id: "dev-user-" + phone.replace(/\D/g, "").slice(-4),
            phone,
            name: "Test User",
            role: "PASSENGER",
          };
        }
        // ─────────────────────────────────────────────────────────────────────

        // Verify OTP from Redis cache
        const cachedOTP = await getOTP(phone);
        if (!cachedOTP || cachedOTP !== otp) return null;

        // OTP is correct — delete it (single use)
        await deleteOTP(phone);

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
          // New user — create with minimal info (they'll complete profile after login)
          user = await prisma.user.create({
            data: {
              phone,
              name: "New User",
              isVerified: true,
            },
          });
        } else if (!user.isVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.phone = (user as { phone?: string }).phone;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.phone = token.phone as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
