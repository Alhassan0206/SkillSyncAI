import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Trophy, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}

interface TestState {
  skill: string;
  testType: string;
  questions: Question[];
  currentIndex: number;
  userAnswers: string[];
  showResults: boolean;
  startTime: number;
  timeLimit: number; // in seconds
}

export default function SkillTest() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [testState, setTestState] = useState<TestState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [skill, setSkill] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timedMode, setTimedMode] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (testState && !testState.showResults && timedMode) {
      const elapsed = Math.floor((Date.now() - testState.startTime) / 1000);
      const remaining = Math.max(0, testState.timeLimit - elapsed);
      setTimeRemaining(remaining);

      timerRef.current = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - testState.startTime) / 1000);
        const newRemaining = Math.max(0, testState.timeLimit - newElapsed);
        setTimeRemaining(newRemaining);

        if (newRemaining <= 0) {
          // Auto-submit when time runs out
          handleTimeUp();
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [testState?.startTime, testState?.showResults, timedMode]);

  const handleTimeUp = () => {
    if (!testState || testState.showResults) return;

    toast({
      title: "Time's up!",
      description: "Your test has been automatically submitted.",
      variant: "destructive"
    });

    // Submit with current answers
    const finalAnswers = [...testState.userAnswers];
    // Fill remaining with empty strings
    while (finalAnswers.length < testState.questions.length) {
      finalAnswers.push("");
    }

    const correctCount = testState.questions.reduce((count, q, index) => {
      return count + (finalAnswers[index] === q.correctAnswer ? 1 : 0);
    }, 0);

    const questionsWithAnswers = testState.questions.map((q, index) => ({
      question: q.question,
      userAnswer: finalAnswers[index] || "(No answer)",
      correctAnswer: q.correctAnswer,
      isCorrect: finalAnswers[index] === q.correctAnswer,
    }));

    const duration = Math.floor((Date.now() - testState.startTime) / 1000);

    saveTestMutation.mutate({
      skill: testState.skill,
      testType: testState.testType,
      score: correctCount,
      maxScore: testState.questions.length,
      duration,
      questions: questionsWithAnswers,
    });

    setTestState({
      ...testState,
      userAnswers: finalAnswers,
      showResults: true,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTestMutation = useMutation({
    mutationFn: async (data: { skill: string; testType: string }) => {
      const response = await apiRequest("POST", `/api/job-seeker/skill-tests/${data.skill}/start`, { testType: data.testType });
      return response.json() as Promise<{ questions: Question[]; skill: string; testType: string }>;
    },
    onSuccess: (data: { questions: Question[]; skill: string; testType: string }) => {
      const timeLimit = timedMode ? data.questions.length * 60 : 0; // 1 minute per question
      setTestState({
        skill: data.skill,
        testType: data.testType,
        questions: data.questions,
        currentIndex: 0,
        userAnswers: [],
        showResults: false,
        startTime: Date.now(),
        timeLimit,
      });
      setTimeRemaining(timeLimit);
      toast({ title: "Test started! Good luck!" });
    },
    onError: (error: any) => {
      if (error.message?.includes("429")) {
        toast({ 
          title: "Rate limit exceeded", 
          description: "You've reached the maximum number of tests per hour. Please try again later.",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to start test", variant: "destructive" });
      }
    },
  });

  const saveTestMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/job-seeker/skill-tests", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-seeker/skill-tests"] });
      toast({ title: "Test results saved!" });
      setTimeout(() => {
        setLocation("/dashboard/skill-passport");
      }, 2000);
    },
  });

  const handleStartTest = () => {
    if (!skill.trim()) {
      toast({ title: "Please enter a skill name", variant: "destructive" });
      return;
    }
    startTestMutation.mutate({ skill, testType: "technical" });
  };

  const handleAnswerSelect = () => {
    if (!testState || !selectedAnswer) return;

    const newAnswers = [...testState.userAnswers, selectedAnswer];
    const isLastQuestion = testState.currentIndex === testState.questions.length - 1;

    if (isLastQuestion) {
      const correctCount = testState.questions.reduce((count, q, index) => {
        return count + (newAnswers[index] === q.correctAnswer ? 1 : 0);
      }, 0);

      const questionsWithAnswers = testState.questions.map((q, index) => ({
        question: q.question,
        userAnswer: newAnswers[index],
        correctAnswer: q.correctAnswer,
        isCorrect: newAnswers[index] === q.correctAnswer,
      }));

      const duration = Math.floor((Date.now() - testState.startTime) / 1000);
      saveTestMutation.mutate({
        skill: testState.skill,
        testType: testState.testType,
        score: correctCount,
        maxScore: testState.questions.length,
        duration,
        questions: questionsWithAnswers,
      });

      setTestState({
        ...testState,
        userAnswers: newAnswers,
        showResults: true,
      });
    } else {
      setTestState({
        ...testState,
        currentIndex: testState.currentIndex + 1,
        userAnswers: newAnswers,
      });
      setSelectedAnswer("");
    }
  };

  if (!testState) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Take a Skill Test</CardTitle>
            <CardDescription>
              Verify your skills with AI-generated assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill">Which skill would you like to test?</Label>
              <input
                id="skill"
                type="text"
                placeholder="e.g., React, Python, SQL"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-background"
                data-testid="input-skill-test"
              />
            </div>

            {/* Timed Mode Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Timed Mode</p>
                  <p className="text-sm text-muted-foreground">1 minute per question</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={timedMode}
                  onChange={(e) => setTimedMode(e.target.checked)}
                  className="sr-only peer"
                  data-testid="checkbox-timed-mode"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <Button
              onClick={handleStartTest}
              disabled={startTestMutation.isPending}
              className="w-full"
              data-testid="button-start-test"
            >
              {startTestMutation.isPending ? "Generating Test..." : "Start Test"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Tests are limited to 5 per hour to ensure quality
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState.showResults) {
    const correctCount = testState.questions.reduce((count, q, index) => {
      return count + (testState.userAnswers[index] === q.correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / testState.questions.length) * 100);

    return (
      <div className="container mx-auto p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">Test Complete!</CardTitle>
            <CardDescription>
              {testState.skill} - {testState.testType} Assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
              <p className="text-muted-foreground">
                {correctCount} out of {testState.questions.length} correct
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Review:</h3>
              {testState.questions.map((q, index) => {
                const isCorrect = testState.userAnswers[index] === q.correctAnswer;
                return (
                  <Card key={index} className={isCorrect ? "border-green-200" : "border-red-200"} data-testid={`result-${index}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-base">{q.question}</CardTitle>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Your answer:</span>{" "}
                              <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                {testState.userAnswers[index]}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="font-medium">Correct answer:</span>{" "}
                                <span className="text-green-600">{q.correctAnswer}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Button onClick={() => setLocation("/dashboard/skill-passport")} className="w-full" data-testid="button-view-passport">
              View Skill Passport
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = testState.questions[testState.currentIndex];
  const progress = ((testState.currentIndex + 1) / testState.questions.length) * 100;
  const isLowTime = timedMode && timeRemaining > 0 && timeRemaining <= 60;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Timer Bar */}
      {timedMode && testState.timeLimit > 0 && (
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${isLowTime ? 'bg-red-100 dark:bg-red-900/30 border border-red-300' : 'bg-muted'}`}>
          <div className="flex items-center gap-2">
            {isLowTime ? (
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5 text-muted-foreground" />
            )}
            <span className={`font-mono text-lg font-bold ${isLowTime ? 'text-red-600 dark:text-red-400' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Time Remaining</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {testState.currentIndex + 1} of {testState.questions.length}</span>
              <span className="capitalize">{currentQuestion.difficulty}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <CardTitle className="text-xl pt-4">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover-elevate border">
                <RadioGroupItem value={option} id={`option-${index}`} data-testid={`radio-option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={handleAnswerSelect}
            disabled={!selectedAnswer}
            className="w-full"
            data-testid="button-next-question"
          >
            {testState.currentIndex === testState.questions.length - 1 ? "Finish Test" : "Next Question"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
