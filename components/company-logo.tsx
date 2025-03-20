"use client"

import * as React from "react"
import { ChevronRight, ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import Link from "next/link"

export function CompanyLogo({
  teams,
}: {
  teams: {
  logo: string
  name: string
  link: string
  }
}) {

  return (
     <Link href={teams.link} className="flex items-center gap-3 p-3">
          <Collapsible
            asChild
            className="group/collapsible"
          >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Image src={teams.logo} alt="logo" width={30} height={30}/>
                  <span>{teams.name}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
          </Collapsible>
    </Link>
  )
}
