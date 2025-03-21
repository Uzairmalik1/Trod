"use server"

import { signIn, signOut } from "@/auth"
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export const login = async () => {
    await signIn("google", {redirectTo: "/home"})
}

export const loginOut = async () => {
    await signOut({redirectTo: "/login"})
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
        
        // If credentials are valid, use NextAuth's signIn function with redirect
        await signIn("credentials", {
            email: email,
            password: password,
            redirectTo: "/home"
        });
        
        // This line will only execute if redirect fails
        redirect("/home");
        
        // Code below this won't execute due to redirect, but including for type safety
        return { success: true };
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
        
        // Automatically sign in after registration with redirect
        await signIn("credentials", {
            email: email,
            password: password,
            redirectTo: "/home"
        });
        
        // This line will only execute if redirect fails
        redirect("/home");

        // Code below this won't execute due to redirect, but including for type safety
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