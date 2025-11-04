import EmployerSidebar from '../EmployerSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function EmployerSidebarExample() {
  return (
    <SidebarProvider>
      <EmployerSidebar />
    </SidebarProvider>
  )
}
