import PricingCard from '../PricingCard'

export default function PricingCardExample() {
  return (
    <PricingCard
      name="Growth"
      price="$99"
      period="month"
      description="For growing teams"
      popular={true}
      features={[
        "Unlimited job postings",
        "AI-powered candidate matching",
        "Advanced analytics dashboard",
        "Team collaboration tools",
        "Priority support"
      ]}
    />
  )
}
