"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

export default function Layout({ children }: { children: React.ReactNode }) {
  // We're using status from session but not session data itself
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login") // Redirect to login if not signed in
    }
  }, [status, router])

  // if (status === "loading") return <p>Loading...</p>

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProvider>
        <AppSidebar />
        <div className="absolute top-[18px] left-10 block md:hidden">
          <SidebarTrigger />
        </div>
        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
