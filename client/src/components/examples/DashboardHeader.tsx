import DashboardHeader from '../DashboardHeader'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardHeaderExample() {
  return (
    <SidebarProvider>
      <DashboardHeader 
        userName="John Doe"
        userRole="Job Seeker"
        notificationCount={3}
      />
    </SidebarProvider>
  )
}
