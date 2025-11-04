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
import { Home, Briefcase, Users, Target, BarChart3, Settings, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

export default function EmployerSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { title: "Overview", icon: Home, url: "/employer" },
    { title: "Jobs", icon: Briefcase, url: "/employer/jobs" },
    { title: "Candidates", icon: Target, url: "/employer/candidates" },
    { title: "Team", icon: Users, url: "/employer/team" },
    { title: "Analytics", icon: BarChart3, url: "/employer/analytics" },
    { title: "Billing", icon: CreditCard, url: "/employer/billing" },
    { title: "Settings", icon: Settings, url: "/employer/settings" },
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
              <span className="font-display font-semibold">SkillSync AI</span>
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
                    <a href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
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
