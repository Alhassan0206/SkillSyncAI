import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Brain, Target, TrendingUp, Users, Zap, Shield, FileText, BarChart3, Calendar, MessageSquare, GitBranch, Award } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Advanced machine learning algorithms analyze candidate profiles and job requirements to find the perfect match with detailed explanations.",
      benefits: ["95% match accuracy", "Instant recommendations", "Explainable AI insights"],
    },
    {
      icon: FileText,
      title: "Smart Resume Parsing",
      description: "Automatically extract skills, experience, and qualifications from resumes with our intelligent parsing technology.",
      benefits: ["Multi-format support", "Skill extraction", "Experience mapping"],
    },
    {
      icon: TrendingUp,
      title: "Personalized Learning Paths",
      description: "AI-generated roadmaps help job seekers acquire the exact skills needed for their target roles.",
      benefits: ["Custom learning plans", "Resource recommendations", "Progress tracking"],
    },
    {
      icon: Target,
      title: "Skill Gap Analysis",
      description: "Identify skill gaps between current abilities and target positions with detailed recommendations.",
      benefits: ["Gap identification", "Priority ranking", "Actionable insights"],
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards provide insights into hiring metrics, match quality, and team performance.",
      benefits: ["Real-time metrics", "Custom reports", "Trend analysis"],
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members, manage permissions, and collaborate seamlessly on hiring decisions.",
      benefits: ["Role-based access", "Team invitations", "Shared workflows"],
    },
    {
      icon: Calendar,
      title: "Interview Scheduling",
      description: "Streamline interview coordination with calendar integrations and automated scheduling.",
      benefits: ["Calendar sync", "Auto-reminders", "Timezone handling"],
    },
    {
      icon: MessageSquare,
      title: "Integrated Communications",
      description: "Keep all candidate communications in one place with built-in messaging and notifications.",
      benefits: ["In-app messaging", "Email notifications", "Slack integration"],
    },
    {
      icon: GitBranch,
      title: "Developer Integrations",
      description: "Connect with GitHub to analyze coding activity and technical contributions for developer roles.",
      benefits: ["GitHub analysis", "Repo insights", "Contribution tracking"],
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with SSO, 2FA, and compliance with global data protection standards.",
      benefits: ["SOC 2 compliant", "GDPR ready", "SSO/SAML support"],
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Integrate SkillSync into your existing tools with our comprehensive REST API.",
      benefits: ["Full API access", "Webhooks", "Custom integrations"],
    },
    {
      icon: Award,
      title: "Verified Skills",
      description: "Build trust with skill verification through assessments, endorsements, and certifications.",
      benefits: ["Skill tests", "Peer endorsements", "Certificate validation"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <a className="flex items-center gap-2" data-testid="link-home">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  S
                </div>
                <span className="font-display font-semibold text-lg">SkillSync AI</span>
              </a>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/features">
                <a className="text-sm font-medium" data-testid="link-features">Features</a>
              </Link>
              <Link href="/pricing">
                <a className="text-sm font-medium" data-testid="link-pricing">Pricing</a>
              </Link>
              <Link href="/resources">
                <a className="text-sm font-medium" data-testid="link-resources">Resources</a>
              </Link>
              <Link href="/about">
                <a className="text-sm font-medium" data-testid="link-about">About</a>
              </Link>
              <Link href="/contact">
                <a className="text-sm font-medium" data-testid="link-contact">Contact</a>
              </Link>
            </div>

            <a href="/api/login">
              <Button variant="default" size="default" data-testid="button-login">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Powerful Features for Modern Hiring
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to find, evaluate, and hire the best talent with AI-powered intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 rounded-lg border bg-card hover-elevate" data-testid={`card-feature-${index}`}>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies using SkillSync AI to build better teams
          </p>
          <a href="/api/login">
            <Button size="lg" variant="secondary" className="text-base px-8" data-testid="button-cta-signup">
              Get Started Free
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              S
            </div>
            <span className="font-display font-semibold text-lg">SkillSync AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 SkillSync AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
