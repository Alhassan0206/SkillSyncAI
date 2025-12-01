import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Target, Heart, Users, Zap } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "We believe everyone deserves access to opportunities that match their skills and aspirations.",
    },
    {
      icon: Heart,
      title: "Human-Centered",
      description: "AI enhances human decision-making, never replaces it. We put people first in everything we build.",
    },
    {
      icon: Users,
      title: "Inclusive",
      description: "We're committed to reducing bias in hiring and creating equal opportunities for all.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously push the boundaries of what's possible with AI and machine learning.",
    },
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former Head of AI at TechCorp with 15 years in machine learning and talent tech.",
    },
    {
      name: "Marcus Johnson",
      role: "CTO & Co-Founder",
      bio: "Previously led engineering teams at major tech companies, passionate about solving hiring challenges.",
    },
    {
      name: "Dr. Aisha Patel",
      role: "Head of AI",
      bio: "PhD in Machine Learning from MIT, specializing in NLP and recommendation systems.",
    },
    {
      name: "David Kim",
      role: "Head of Product",
      bio: "10+ years building products that connect people and opportunities at scale.",
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

            <a href="/login">
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
              Transforming How Companies Find Talent
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to match the right talent with the right opportunities using the power of artificial intelligence.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-24">
            <div className="p-8 rounded-lg border bg-card">
              <h2 className="font-display text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  SkillSync AI was born from a simple observation: hiring is broken. Companies spend months searching for talent while qualified candidates struggle to find roles that match their skills.
                </p>
                <p>
                  In 2023, our founders came together with decades of combined experience in AI, recruiting, and product development. We asked ourselves: what if we could use AI not to replace human judgment, but to enhance it?
                </p>
                <p>
                  Today, SkillSync AI helps thousands of companies and job seekers connect more effectively. Our AI analyzes skills, generates learning paths, and creates intelligent matches that benefit both employers and candidates.
                </p>
                <p>
                  We're just getting started. Join us on our journey to make hiring more efficient, more fair, and more human.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-24">
            <h2 className="font-display text-4xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="text-center" data-testid={`value-${index}`}>
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-24">
            <h2 className="font-display text-4xl font-bold mb-12 text-center">Leadership Team</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {team.map((member, index) => (
                <div key={index} className="p-6 rounded-lg border bg-card" data-testid={`team-member-${index}`}>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-2xl font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-primary mb-3">{member.role}</p>
                  <p className="text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="p-8 rounded-lg bg-primary text-primary-foreground text-center">
              <h2 className="font-display text-3xl font-bold mb-4">Join Our Mission</h2>
              <p className="text-xl mb-6 opacity-90">
                We're always looking for talented people who share our vision
              </p>
              <Link href="/contact">
                <a>
                  <Button variant="secondary" size="lg" data-testid="button-careers">
                    View Open Positions
                  </Button>
                </a>
              </Link>
            </div>
          </div>
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
