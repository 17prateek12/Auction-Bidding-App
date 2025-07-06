'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar";
import Link from 'next/link';
import { NavBarItem } from '@/interface/interface';
import { House } from 'lucide-react';
import { Radio } from 'lucide-react';
import { ChartNoAxesGantt } from 'lucide-react';
import { Plus } from 'lucide-react';
import { History } from 'lucide-react';

const SidebarMenuContent = () => {
    const navItem: NavBarItem[] = [
        { logo: House, label: 'Home', link: '/home' },
        { logo: Plus, label: 'Create Event', link: '/home/create-event' },
        { logo: Radio, label: 'Live Event', link: '/home/live-event' },
        { logo: ChartNoAxesGantt, label: 'My Event', link: '/home/mine-event' },
        { logo: History, label: 'Past Event', link: '/home/past-event' },
    ];
    const pathname = usePathname();
    const { open } = useSidebar();
    return (
        <SidebarGroup className='flex flex-col'>
            <SidebarMenu className={`flex flex-col w-full justify-center gap-2 mt-2 ${open ? 'items-start' : 'items-center'}`}>
                {navItem.map((item, index) => {
                    const isActive = pathname === item.link;
                    const Logo = item.logo;

                    return (
                        <SidebarMenuItem key={index}>
                            <Link href={item.link}>
                                <SidebarMenuButton
                                    tooltip={item.label}
                                    className={`flex w-[200px] h-[48px] items-center gap-4 my-2 rounded-lg px-4 py-4 text-base font-medium transition ${isActive
                                        ? "text-red-500 bg-black"
                                        : "text-gray-500"
                                        } hover:text-red-300`}
                                >
                                    <Logo />
                                    <p>{item.label}</p>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

export default SidebarMenuContent