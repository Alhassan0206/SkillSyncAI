import FeatureCard from '../FeatureCard'
import { Brain } from 'lucide-react'

export default function FeatureCardExample() {
  return (
    <FeatureCard 
      icon={Brain}
      title="AI-Powered Matching"
      description="Our advanced AI analyzes skills, experience, and project requirements to find the perfect match between candidates and opportunities."
    />
  )
}
