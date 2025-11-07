import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function DashboardHeader({ 
  userName, 
  userRole, 
  notificationCount = 0, 
  title, 
  subtitle, 
  action 
}: DashboardHeaderProps) {
  if (title || subtitle) {
    return (
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" alt={userName || "User"} />
                <AvatarFallback>{userName?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{userName || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">Profile</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">Settings</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-billing">Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-logout">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
