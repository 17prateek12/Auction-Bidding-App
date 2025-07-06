import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import SidebarMenuHeader from "./sidebar-menu-header";
import SidebarMenuContent from "./sidebar-menu-content";

const AppSideBar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuHeader />
      </SidebarHeader>
      <SidebarContent>
       <SidebarMenuContent />
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSideBar