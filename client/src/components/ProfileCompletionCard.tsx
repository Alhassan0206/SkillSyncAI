import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileItem {
  label: string;
  completed: boolean;
  action: string;
}

interface ProfileCompletionCardProps {
  percentage: number;
  items: ProfileItem[];
}

export default function ProfileCompletionCard({ percentage, items }: ProfileCompletionCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Complete Your Profile</h3>
          <span className="text-2xl font-bold text-primary" data-testid="text-completion-percentage">
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                {item.label}
              </span>
            </div>
            {!item.completed && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="shrink-0"
                data-testid={`button-${item.action}`}
              >
                {item.action}
              </Button>
            )}
          </div>
        ))}
      </div>

      {percentage === 100 && (
        <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-md">
          <p className="text-sm text-success font-medium text-center">
            🎉 Profile Complete! You're now visible to employers.
          </p>
        </div>
      )}
    </Card>
  );
}
