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
import { Home, User, Briefcase, Target, BookOpen, Settings, FileText, Award, TestTube } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function JobSeekerSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { title: "Overview", icon: Home, url: "/dashboard" },
    { title: "Profile", icon: User, url: "/dashboard/profile" },
    { title: "Skill Passport", icon: Award, url: "/dashboard/skill-passport" },
    { title: "Skill Test", icon: TestTube, url: "/dashboard/skill-test" },
    { title: "Job Matches", icon: Target, url: "/dashboard/matches" },
    { title: "Applications", icon: FileText, url: "/dashboard/applications" },
    { title: "Learning Plan", icon: BookOpen, url: "/dashboard/learning" },
    { title: "Settings", icon: Settings, url: "/dashboard/settings" },
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
