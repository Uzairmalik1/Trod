"use server"

import { signIn, signOut } from "@/auth"
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthError } from "next-auth";

const prisma = new PrismaClient();

export const login = async () => {
    await signIn("google", {redirectTo: "/home"})
}

export const loginOut = async () => {
    try {
        // More forceful logout that cleans up all session data
        await signOut({
            redirectTo: "/login"
        });
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: "Failed to log out" };
    }
}

export const loginWithCredentials = async (email: string, password: string) => {
    try {
        // First check if the user exists and password is correct
        const user = await prisma.user.findUnique({
            where: { email: email }
        });
        
        if (!user) {
            return { 
                success: false, 
                error: "User not found" 
            };
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password || "");
        
        if (!isPasswordValid) {
            return { 
                success: false, 
                error: "Invalid password" 
            };
        }
        
        // If credentials are valid, use NextAuth's signIn function with client-side redirect disabled
        // This allows us to handle redirection more reliably on the client
        try {
            const result = await signIn("credentials", {
                email: email,
                password: password,
                redirect: false
            });
            
            // Check if sign in was successful
            if (result?.error) {
                return { 
                    success: false, 
                    error: result.error 
                };
            }
            
            return { success: true };
        } catch (signInError) {
            console.error("Sign-in error:", signInError);
            return { 
                success: false, 
                error: "Authentication failed" 
            };
        }
    } catch (error) {
        console.error("Login error:", error);
        if (error instanceof AuthError) {
            return { 
                success: false, 
                error: "Authentication failed: " + error.message
            };
        }
        return { 
            success: false, 
            error: "Invalid email or password" 
        };
    } finally {
        await prisma.$disconnect();
    }
}

export const registerUser = async (name: string, email: string, password: string) => {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { 
                success: false, 
                error: "User with this email already exists" 
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });
        
        // Automatically sign in after registration
        try {
            const signInResult = await signIn("credentials", {
                email: email,
                password: password,
                redirect: false
            });
            
            if (signInResult?.error) {
                console.error("Auto signin after registration failed:", signInResult.error);
            }
        } catch (signInError) {
            console.error("Error signing in after registration:", signInError);
        }

        return { success: true, userId: newUser.id };
    } catch (error) {
        console.error("Registration error:", error);
        return { 
            success: false, 
            error: "Failed to register user" 
        };
    } finally {
        await prisma.$disconnect();
    }
}