import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb/connection";
import User from "@/lib/mongodb/models/User";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/database";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.JWT_LIFESPAN || "86400"), // Set in .env
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        if (!credentials?.email || !credentials?.password) throw new Error("Missing credentials");

        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user || !user.isActive) throw new Error("Invalid credentials or account disabled");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // REVOCATION LOGIC: Check database status on every token validation
      // This allows you to "kill" a token immediately by setting isActive: false
      await connectDB();
      const dbUser = await User.findById(token.id).select("isActive");

      if (!dbUser || !dbUser.isActive) {
        throw new Error("Token revoked");
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to the last page before login or home page
      return url || baseUrl;
    }
  },
  pages: { signIn: "/signin" }
};

export const auth = NextAuth(authOptions);
