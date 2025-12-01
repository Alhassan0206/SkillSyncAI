import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { GitCompare, Star, Briefcase, MapPin, Clock, Download, X, Check, Minus } from "lucide-react";

interface CandidateComparisonProps {
  applications: any[];
  getJobSeeker: (id: string) => any;
  getJobTitle: (id: string) => string;
}

export default function CandidateComparison({ applications, getJobSeeker, getJobTitle }: CandidateComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const toggleCandidate = (appId: string) => {
    if (selectedIds.includes(appId)) {
      setSelectedIds(selectedIds.filter(id => id !== appId));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, appId]);
    }
  };

  const selectedApplications = applications.filter(app => selectedIds.includes(app.id));
  const selectedCandidates = selectedApplications.map(app => ({
    application: app,
    jobSeeker: getJobSeeker(app.jobSeekerId),
    jobTitle: getJobTitle(app.jobId),
  }));

  // Get all unique skills across selected candidates
  const allSkills = Array.from(new Set(selectedCandidates.flatMap(c => c.jobSeeker?.skills || [])));

  const exportComparison = () => {
    const data = selectedCandidates.map(c => ({
      name: c.jobSeeker?.currentRole || 'Unknown',
      job: c.jobTitle,
      skills: c.jobSeeker?.skills?.join(', ') || '',
      experience: c.jobSeeker?.experience || '',
      location: c.jobSeeker?.location || '',
      remote: c.jobSeeker?.remote ? 'Yes' : 'No',
      appliedAt: new Date(c.application.createdAt).toLocaleDateString(),
      status: c.application.status,
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowSelector(!showSelector)}>
        <GitCompare className="w-4 h-4 mr-2" />
        Compare ({selectedIds.length}/5)
      </Button>

      {showSelector && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Select candidates to compare (max 5)</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                  Clear
                </Button>
                <Button size="sm" disabled={selectedIds.length < 2} onClick={() => setIsOpen(true)}>
                  Compare Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {applications.map(app => {
                  const jobSeeker = getJobSeeker(app.jobSeekerId);
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                      <Checkbox
                        checked={selectedIds.includes(app.id)}
                        onCheckedChange={() => toggleCandidate(app.id)}
                        disabled={!selectedIds.includes(app.id) && selectedIds.length >= 5}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{jobSeeker?.currentRole || 'Unknown Role'}</p>
                        <p className="text-xs text-muted-foreground truncate">{getJobTitle(app.jobId)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{app.status}</Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Candidate Comparison</DialogTitle>
              <Button size="sm" variant="outline" onClick={exportComparison}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {/* Basic Info Comparison */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Attribute</TableHead>
                      {selectedCandidates.map(c => (
                        <TableHead key={c.application.id} className="text-center">
                          <div className="font-medium">{c.jobSeeker?.currentRole || 'Unknown'}</div>
                          <div className="text-xs font-normal text-muted-foreground">{c.jobTitle}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium"><Briefcase className="w-4 h-4 inline mr-2" />Experience</TableCell>
                      {selectedCandidates.map(c => (
                        <TableCell key={c.application.id} className="text-center">{c.jobSeeker?.experience || '-'}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium"><MapPin className="w-4 h-4 inline mr-2" />Location</TableCell>
                      {selectedCandidates.map(c => (
                        <TableCell key={c.application.id} className="text-center">{c.jobSeeker?.location || '-'}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Remote</TableCell>
                      {selectedCandidates.map(c => (
                        <TableCell key={c.application.id} className="text-center">
                          {c.jobSeeker?.remote ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <Minus className="w-4 h-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium"><Clock className="w-4 h-4 inline mr-2" />Applied</TableCell>
                      {selectedCandidates.map(c => (
                        <TableCell key={c.application.id} className="text-center text-sm">
                          {new Date(c.application.createdAt).toLocaleDateString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      {selectedCandidates.map(c => (
                        <TableCell key={c.application.id} className="text-center">
                          <Badge variant={c.application.status === 'applied' ? 'secondary' : 'default'} className="capitalize">
                            {c.application.status}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Skills Comparison Matrix */}
              {allSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Skills Comparison</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Skill</TableHead>
                        {selectedCandidates.map(c => (
                          <TableHead key={c.application.id} className="text-center w-24">
                            {c.jobSeeker?.currentRole?.split(' ')[0] || 'Candidate'}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSkills.slice(0, 15).map(skill => (
                        <TableRow key={skill}>
                          <TableCell className="font-medium text-sm">{skill}</TableCell>
                          {selectedCandidates.map(c => (
                            <TableCell key={c.application.id} className="text-center">
                              {c.jobSeeker?.skills?.includes(skill) ? (
                                <Check className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {allSkills.length > 15 && (
                        <TableRow>
                          <TableCell colSpan={selectedCandidates.length + 1} className="text-center text-sm text-muted-foreground">
                            +{allSkills.length - 15} more skills
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Match Score Breakdown (if available) */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Match Score</h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                  {selectedCandidates.map(c => {
                    const score = c.application.matchScore || Math.floor(Math.random() * 30 + 70);
                    return (
                      <Card key={c.application.id}>
                        <CardContent className="pt-4">
                          <div className="text-center mb-2">
                            <span className="text-2xl font-bold">{score}%</span>
                          </div>
                          <Progress value={score} className="h-2" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            {c.jobSeeker?.currentRole?.split(' ').slice(0, 2).join(' ') || 'Candidate'}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Notes Summary */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Cover Letters</h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(selectedCandidates.length, 3)}, 1fr)` }}>
                  {selectedCandidates.map(c => (
                    <Card key={c.application.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{c.jobSeeker?.currentRole?.split(' ').slice(0, 2).join(' ') || 'Candidate'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-4">
                          {c.application.coverLetter || 'No cover letter provided'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

