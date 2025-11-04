import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Mail, Github, Star } from "lucide-react";

interface CandidateMatchCardProps {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  matchScore: number;
  skills: string[];
  experience: string;
  githubUrl?: string;
  email?: string;
  avatarUrl?: string;
  matchExplanation: string;
}

export default function CandidateMatchCard({
  name,
  currentRole,
  location,
  matchScore,
  skills,
  experience,
  githubUrl,
  email,
  avatarUrl,
  matchExplanation,
}: CandidateMatchCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="text-lg font-semibold">{getInitials(name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold" data-testid="text-candidate-name">{name}</h3>
              <p className="text-sm text-muted-foreground">{currentRole}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(matchScore)}`} data-testid="text-candidate-score">
                {matchScore}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning" />
                Match
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
            <span>{experience}</span>
            {githubUrl && (
              <a href={githubUrl} className="flex items-center gap-1 hover:text-foreground">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Why they're a match:</span> {matchExplanation}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Key Skills</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <Badge key={idx} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="default" className="flex-1" data-testid="button-shortlist">
          Add to Shortlist
        </Button>
        <Button variant="outline" className="flex-1" data-testid="button-message">
          <Mail className="w-4 h-4 mr-2" />
          Message
        </Button>
      </div>
    </Card>
  );
}
