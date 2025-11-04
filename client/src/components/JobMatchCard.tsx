import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, BookmarkPlus } from "lucide-react";
import { useState } from "react";

interface JobMatchCardProps {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  remote?: boolean;
  salaryRange?: string;
  matchScore: number;
  matchingSkills: string[];
  gapSkills: string[];
  matchExplanation: string;
  companyLogo?: string;
}

export default function JobMatchCard({
  companyName,
  jobTitle,
  location,
  remote = false,
  salaryRange,
  matchScore,
  matchingSkills,
  gapSkills,
  matchExplanation,
  companyLogo,
}: JobMatchCardProps) {
  const [bookmarked, setBookmarked] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 rounded-md bg-card border flex items-center justify-center shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="w-12 h-12 object-contain" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {companyName.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1" data-testid={`text-job-title`}>{jobTitle}</h3>
            <p className="text-sm text-muted-foreground mb-2">{companyName}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
              {remote && (
                <Badge variant="secondary" className="text-xs">Remote</Badge>
              )}
              {salaryRange && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {salaryRange}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className={`text-3xl font-bold ${getScoreColor(matchScore)}`} data-testid="text-match-score">
            {matchScore}%
          </div>
          <p className="text-xs text-muted-foreground">Match</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-medium">Why you're a match:</span> {matchExplanation}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Matching Skills</p>
        <div className="flex flex-wrap gap-2">
          {matchingSkills.map((skill, idx) => (
            <Badge key={idx} variant="secondary" className="bg-success/10 text-success border-success/20">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {gapSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Skills to Develop</p>
          <div className="flex flex-wrap gap-2">
            {gapSkills.map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-muted-foreground">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="default" className="flex-1" data-testid="button-apply">
          Apply Now
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setBookmarked(!bookmarked)}
          className={bookmarked ? 'bg-primary/10' : ''}
          data-testid="button-bookmark"
        >
          <BookmarkPlus className={`w-5 h-5 ${bookmarked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}
