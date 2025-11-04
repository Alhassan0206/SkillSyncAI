import ApplicationTimelineCard from '../ApplicationTimelineCard'

export default function ApplicationTimelineCardExample() {
  return (
    <ApplicationTimelineCard
      jobTitle="Senior React Developer"
      companyName="TechCorp Inc"
      events={[
        { stage: "Applied", status: "completed", date: "Jan 15, 2024" },
        { stage: "Resume Reviewed", status: "completed", date: "Jan 16, 2024" },
        { stage: "Phone Screen", status: "current", date: "Jan 20, 2024", note: "Scheduled for tomorrow at 2 PM" },
        { stage: "Technical Interview", status: "pending" },
        { stage: "Final Interview", status: "pending" },
        { stage: "Offer", status: "pending" }
      ]}
    />
  )
}
