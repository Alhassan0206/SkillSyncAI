import ProfileCompletionCard from '../ProfileCompletionCard'

export default function ProfileCompletionCardExample() {
  return (
    <ProfileCompletionCard
      percentage={60}
      items={[
        { label: "Upload resume", completed: true, action: "Upload" },
        { label: "Add skills", completed: true, action: "Add" },
        { label: "Complete work experience", completed: false, action: "Complete" },
        { label: "Add portfolio projects", completed: false, action: "Add" },
        { label: "Set profile visibility", completed: true, action: "Update" }
      ]}
    />
  )
}
