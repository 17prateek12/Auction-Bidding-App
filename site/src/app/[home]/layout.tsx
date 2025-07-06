import AppSideBar from "@/components/sidebar-components/app-side-bar";
import SiteNavbar from "@/components/site-header/site-navbar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="w-full overflow-hidden">
            <SidebarProvider>
                <AppSideBar variant="inset" />
                <SidebarInset className="bg-gray-800">
                    <SiteNavbar />
                    {children}
                </SidebarInset>
            </SidebarProvider>

        </div>
    );
}
