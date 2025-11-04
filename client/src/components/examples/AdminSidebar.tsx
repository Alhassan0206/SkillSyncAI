import AdminSidebar from '../AdminSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AdminSidebarExample() {
  return (
    <SidebarProvider>
      <AdminSidebar />
    </SidebarProvider>
  )
}
