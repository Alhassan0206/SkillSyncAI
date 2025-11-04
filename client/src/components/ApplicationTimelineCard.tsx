import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface TimelineEvent {
  stage: string;
  status: "completed" | "current" | "pending" | "rejected";
  date?: string;
  note?: string;
}

interface ApplicationTimelineCardProps {
  jobTitle: string;
  companyName: string;
  events: TimelineEvent[];
}

export default function ApplicationTimelineCard({ 
  jobTitle, 
  companyName, 
  events 
}: ApplicationTimelineCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "current":
        return <Clock className="w-5 h-5 text-primary" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "current":
        return "bg-primary";
      case "rejected":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1" data-testid="text-application-title">{jobTitle}</h3>
        <p className="text-sm text-muted-foreground">{companyName}</p>
      </div>

      <div className="relative">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4 pb-8 last:pb-0">
            <div className="relative flex flex-col items-center">
              {getStatusIcon(event.status)}
              {index < events.length - 1 && (
                <div className={`w-0.5 h-full mt-2 ${getStatusColor(event.status)}`} />
              )}
            </div>

            <div className="flex-1 -mt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{event.stage}</span>
                {event.status === "current" && (
                  <Badge variant="secondary" className="text-xs">In Progress</Badge>
                )}
                {event.status === "rejected" && (
                  <Badge variant="destructive" className="text-xs">Rejected</Badge>
                )}
              </div>
              {event.date && (
                <p className="text-xs text-muted-foreground mb-1">{event.date}</p>
              )}
              {event.note && (
                <p className="text-sm text-muted-foreground">{event.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
