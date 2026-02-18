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
    maxAge: parseInt(process.env.JWT_LIFESPAN || "86400"),
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
          emailVerified: user.emailVerified || null,
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
      
      if (account?.provider === 'google' && profile?.email) {
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
          // Create new user
          const now = new Date();
          
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
          
          userDoc.emailVerified = now;
          
          const result = await User.collection.insertOne(userDoc);
          const newUser = await User.findById(result.insertedId);
          
          if (!newUser) {
            throw new Error('Failed to create user');
          }
          
          (user as any).id = newUser._id.toString();
          (user as any).role = 'user';
          (user as any).profileCompleted = false;
          (user as any).provider = 'google';
          (user as any).emailVerified = newUser.emailVerified;
        } else {
          // EXISTING USER
          console.log('[signIn] Existing user:', existingUser._id.toString());
          console.log('[signIn] DB profileCompleted:', existingUser.profileCompleted);
          console.log('[signIn] Fields:', {
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            country: existingUser.country,
            phoneNumber: existingUser.phoneNumber,
          });

          // Update Google ID if not set
          if (!existingUser.googleId) {
            existingUser.googleId = String(sub);
            existingUser.provider = 'google';
          }

          // Check if profile is complete
          const hasRequiredFields = 
            existingUser.firstName && 
            existingUser.lastName && 
            existingUser.country &&
            existingUser.phoneNumber;

          console.log('[signIn] Has required fields:', hasRequiredFields);

          // FORCE UPDATE if user has required fields
          if (hasRequiredFields) {
            if (!existingUser.profileCompleted) {
              console.log('[signIn] FORCING profileCompleted to TRUE');
              
              // Use updateOne to force the update
              await User.updateOne(
                { _id: existingUser._id },
                { 
                  $set: { 
                    profileCompleted: true,
                    profileCompletedAt: new Date()
                  }
                }
              );
              
              // Reload user to get updated data
              const updatedUser = await User.findById(existingUser._id);
              if (updatedUser) {
                existingUser.profileCompleted = updatedUser.profileCompleted;
                console.log('[signIn] Reloaded profileCompleted:', updatedUser.profileCompleted);
              }
            }
          }

          (user as any).id = existingUser._id.toString();
          (user as any).role = existingUser.role as UserRole;
          (user as any).profileCompleted = existingUser.profileCompleted;
          (user as any).provider = existingUser.provider;
          (user as any).emailVerified = existingUser.emailVerified;

          console.log('[signIn] Final user.profileCompleted:', (user as any).profileCompleted);
        }
      }
      
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      console.log('[jwt] START - user exists:', !!user, 'trigger:', trigger);
      
      if (user) {
        // Initial sign in
        token.id = user.id as string;
        token.role = user.role as UserRole;
        token.profileCompleted = (user as any).profileCompleted ?? false;
        token.provider = (user as any).provider ?? 'credentials';
        token.emailVerified = (user as any).emailVerified ?? null;
        console.log('[jwt] Initial sign in - profileCompleted from user:', token.profileCompleted);
      }

      // ALWAYS fetch fresh data from database
      await connectDB();
      const dbUser = await User.findById(token.id).select("isActive profileCompleted emailVerified provider");

      if (!dbUser || !dbUser.isActive) {
        throw new Error("Token revoked");
      }
      
      console.log('[jwt] Token before DB:', token.profileCompleted);
      console.log('[jwt] Database value:', dbUser.profileCompleted);
      
      // FORCE update from database
      token.profileCompleted = dbUser.profileCompleted;
      
      console.log('[jwt] Token after DB:', token.profileCompleted);
      
      token.emailVerified = dbUser.emailVerified || null;
      token.provider = dbUser.provider;

      return token;
    },

    async session({ session, token }) {
      console.log('[session] Token profileCompleted:', token.profileCompleted);
      
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.provider = token.provider as 'credentials' | 'google';
        session.user.emailVerified = (token.emailVerified as Date | null) || null;
      }
      
      console.log('[session] Session profileCompleted:', session.user.profileCompleted);
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url || baseUrl;
    }
  },

  pages: { signIn: "/login" }
};

export const auth = NextAuth(authOptions);
