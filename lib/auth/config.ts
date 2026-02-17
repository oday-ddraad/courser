import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
        
        // Ensure user has password (OAuth users won't have one)
        if (!user.password) throw new Error("Invalid credentials");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");


        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          profileCompleted: user.profileCompleted,
          provider: user.provider,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB();
      
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && profile?.email) {
        // Extract only the fields we need, explicitly excluding email_verified
        const { 
          email, 
          name, 
          given_name, 
          family_name, 
          sub,
          picture 
        } = profile as any;
        
        const existingUser = await User.findOne({ email });
        
        if (!existingUser) {
          // Create new user - explicitly control all fields
          const now = new Date();
          
          // Build document with explicit types
          const userDoc: any = {
            email: String(email),
            name: String(name || email.split('@')[0]),
            firstName: given_name ? String(given_name) : '',
            lastName: family_name ? String(family_name) : '',
            provider: 'google',
            googleId: String(sub),
            profileCompleted: false,
            role: 'user',
            country: 'US',
            locale: 'en',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          };
          
          // Set emailVerified separately to ensure it's a Date
          userDoc.emailVerified = now;
          
          console.log('Inserting Google user:', {
            email: userDoc.email,
            emailVerified: userDoc.emailVerified,
            emailVerifiedType: typeof userDoc.emailVerified,
            isDate: userDoc.emailVerified instanceof Date,
          });
          
          // Use insertOne to bypass Mongoose validation
          const result = await User.collection.insertOne(userDoc);
          const newUser = await User.findById(result.insertedId);
          
          if (!newUser) {
            throw new Error('Failed to create user');
          }
          
          console.log('Created Google user:', newUser._id, 'emailVerified:', newUser.emailVerified);








          
          (user as any).id = newUser._id.toString();
          (user as any).role = 'user';
          (user as any).profileCompleted = false;
          (user as any).provider = 'google';
        } else {
          // Existing user - update Google ID if not set
          if (!existingUser.googleId) {
            existingUser.googleId = String(sub);
            existingUser.provider = 'google';
            await existingUser.save();
          }

          
          (user as any).id = existingUser._id.toString();
          (user as any).role = existingUser.role as UserRole;
          (user as any).profileCompleted = existingUser.profileCompleted;
          (user as any).provider = existingUser.provider;
        }
      }
      
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
        token.profileCompleted = (user as any).profileCompleted ?? false;
        token.provider = (user as any).provider ?? 'credentials';
      }


      // REVOCATION LOGIC: Check database status on every token validation
      // This allows you to "kill" a token immediately by setting isActive: false
      await connectDB();
      const dbUser = await User.findById(token.id).select("isActive profileCompleted");

      if (!dbUser || !dbUser.isActive) {
        throw new Error("Token revoked");
      }
      
      // Update profileCompleted from database
      token.profileCompleted = dbUser.profileCompleted;

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.provider = token.provider as 'credentials' | 'google';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to the last page before login or home page
      return url || baseUrl;
    }
  },

  pages: { signIn: "/login" }

};

export const auth = NextAuth(authOptions);
