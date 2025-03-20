"use server"

import { signIn, signOut } from "@/auth"

export const login = async () => {
    await signIn("google", {redirectTo: "/home"})
}

export const loginOut = async () => {
    await signOut({redirectTo: "/login"})
}