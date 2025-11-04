import JobSeekerSidebar from '../JobSeekerSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function JobSeekerSidebarExample() {
  return (
    <SidebarProvider>
      <JobSeekerSidebar />
    </SidebarProvider>
  )
}
