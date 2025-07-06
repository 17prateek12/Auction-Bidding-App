'use client';
import React from 'react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

const SidebarMenuHeader = () => {

    const {
        open,
    } = useSidebar()

    return (
        <SidebarMenu className='ml-1'>
            <SidebarMenuItem>
                <SidebarMenuButton className='text-5xl mx-auto font-bold text-gray-800 h-[4rem]'>
                    {
                        open ? 'Auctify' : 'A'
                    }
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

    )
}

export default SidebarMenuHeader