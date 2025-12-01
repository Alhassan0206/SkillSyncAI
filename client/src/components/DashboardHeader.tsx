import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Notifications from "./Notifications";
import { useLocation } from "wouter";
import { apiRequest, clearCsrfToken } from "@/lib/queryClient";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  rolePrefix?: string;
}

export default function DashboardHeader({
  userName,
  userRole,
  notificationCount = 0,
  title,
  subtitle,
  action,
  rolePrefix = "/dashboard"
}: DashboardHeaderProps) {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      clearCsrfToken();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      clearCsrfToken();
      window.location.href = '/';
    }
  };
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
        <Notifications />
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
            <DropdownMenuItem 
              data-testid="menu-profile"
              onClick={() => setLocation(`${rolePrefix}/profile`)}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              data-testid="menu-settings"
              onClick={() => setLocation(`${rolePrefix}/settings`)}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              data-testid="menu-billing"
              onClick={() => setLocation(`${rolePrefix}/billing`)}
            >
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              data-testid="menu-logout"
              onClick={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
