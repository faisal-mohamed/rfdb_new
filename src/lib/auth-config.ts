import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Use JWT strategy (no database sessions)
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use findFirst to include non-unique filters like isActive
          const user = await prisma.user.findFirst({
            where: { 
              email: credentials.email.toLowerCase(),
              isActive: true 
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          // Return user data for JWT
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            userType: user.userType,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    // Store user data in JWT token
    async jwt({ token, user }) {
      console.log("=== JWT CALLBACK ===");
      console.log("JWT token before:", token);
      console.log("JWT user:", user);
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userType = user.userType;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        
        console.log("JWT token after adding user data:", token);
      }
      
      console.log("=== END JWT CALLBACK ===");
      return token;
    },
    
    // Make user data available in session
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Session before:", session);
      console.log("Token in session callback:", token);
      
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.userType = token.userType as any;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        
        console.log("Session after adding token data:", session);
      }
      
      console.log("=== END SESSION CALLBACK ===");
      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};
