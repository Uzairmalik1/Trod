"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  DollarSign,
  Frame,
  GalleryVerticalEnd,
  HomeIcon,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { CompanyLogo } from "./company-logo"
import { useSession } from 'next-auth/react'
import { GrSchedule, GrServices } from "react-icons/gr"
import { MdAutoFixNormal } from "react-icons/md"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { data: session } = useSession()

// This is sample data.
const data = {
  user: {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "guest@example.com",
    avatar: session?.user?.image || "/default-avatar.png",
  },
  logo: {
    logo: "/logo.png",
    name: "Editur",
    link: "/home"
  },
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: HomeIcon,
      isActive: true,
      // items: [
      //   {
      //     title: "History",
      //     url: "#",
      //   },
      //   {
      //     title: "Starred",
      //     url: "#",
      //   },
      //   {
      //     title: "Settings",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Publish & Schedule",
      url: "/shedule",
      icon: GrSchedule,
      // items: [
      //   {
      //     title: "Genesis",
      //     url: "#",
      //   },
      //   {
      //     title: "Explorer",
      //     url: "#",
      //   },
      //   {
      //     title: "Quantum",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Automated Series",
      url: "/automated-series",
      icon: MdAutoFixNormal,
      // items: [
      //   {
      //     title: "Introduction",
      //     url: "#",
      //   },
      //   {
      //     title: "Get Started",
      //     url: "#",
      //   },
      //   {
      //     title: "Tutorials",
      //     url: "#",
      //   },
      //   {
      //     title: "Changelog",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Services",
      url: "/services",
      icon: GrServices,
      // items: [
      //   {
      //     title: "General",
      //     url: "#",
      //   },
      //   {
      //     title: "Team",
      //     url: "#",
      //   },
      //   {
      //     title: "Billing",
      //     url: "#",
      //   },
      //   {
      //     title: "Limits",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: DollarSign,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

  return (
    <Sidebar collapsible="icon" {...props}>
        <div className=" absolute top-5 right-3 hidden sm:block">
        <SidebarTrigger />
        </div>
      <SidebarHeader>
        <CompanyLogo teams={data.logo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
