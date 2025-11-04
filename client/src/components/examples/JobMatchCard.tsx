import JobMatchCard from '../JobMatchCard'

export default function JobMatchCardExample() {
  return (
    <JobMatchCard
      id="1"
      companyName="TechCorp Inc"
      jobTitle="Senior Frontend Developer"
      location="San Francisco, CA"
      remote={true}
      salaryRange="$120k - $160k"
      matchScore={92}
      matchingSkills={["React", "TypeScript", "Node.js", "CSS"]}
      gapSkills={["GraphQL", "AWS"]}
      matchExplanation="Your 5+ years of React experience and TypeScript expertise align perfectly with this role. Your portfolio demonstrates strong component architecture skills."
    />
  )
}
