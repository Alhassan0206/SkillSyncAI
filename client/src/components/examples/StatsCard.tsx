import StatsCard from '../StatsCard'
import { Users } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <StatsCard
      title="Total Matches"
      value="2,345"
      change="+12% from last month"
      changeType="positive"
      icon={Users}
    />
  )
}
