import NextAuth from 'next-auth'
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma client
const prisma = new PrismaClient();

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Find user by email
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string }
                    });

                    // If user doesn't exist or password doesn't match
                    if (!user || !user.password) {
                        return null;
                    }

                    // Compare password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password as string, 
                        user.password
                    );
                    
                    if (!isPasswordValid) {
                        return null;
                    }

                    // Return user object if authentication is successful
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name
                    };
                } catch (error) {
                    console.error("Error during authentication:", error);
                    return null;
                } finally {
                    await prisma.$disconnect();
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
        signOut: '/login',
        error: '/login'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    trustHost: true
})