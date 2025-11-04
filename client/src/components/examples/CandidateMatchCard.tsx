import CandidateMatchCard from '../CandidateMatchCard'

export default function CandidateMatchCardExample() {
  return (
    <CandidateMatchCard
      id="1"
      name="Sarah Johnson"
      currentRole="Full Stack Developer"
      location="New York, NY"
      matchScore={94}
      skills={["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]}
      experience="5+ years experience"
      githubUrl="https://github.com/sarahjohnson"
      email="sarah@example.com"
      matchExplanation="Strong technical background with 5 years in full-stack development. Expertise in React and Node.js perfectly aligns with your requirements. Active open-source contributor with proven track record."
    />
  )
}
