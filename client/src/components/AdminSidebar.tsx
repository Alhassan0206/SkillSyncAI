import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, Building2, Users, Activity, DollarSign, FileText, Settings, Flag, Ticket, ListTodo } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function AdminSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { title: "Overview", icon: Home, url: "/admin" },
    { title: "Tenants", icon: Building2, url: "/admin/tenants" },
    { title: "Users", icon: Users, url: "/admin/users" },
    { title: "System Health", icon: Activity, url: "/admin/health" },
    { title: "Job Queues", icon: ListTodo, url: "/admin/queues" },
    { title: "Finance", icon: DollarSign, url: "/admin/finance" },
    { title: "Support Tickets", icon: Ticket, url: "/admin/support" },
    { title: "Audit Logs", icon: FileText, url: "/admin/logs" },
    { title: "Feature Flags", icon: Flag, url: "/admin/flags" },
    { title: "Settings", icon: Settings, url: "/admin/settings" },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                S
              </div>
              <span className="font-display font-semibold">SkillSync Admin</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
