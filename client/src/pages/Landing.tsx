import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, TrendingUp, Users, Zap, Shield } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_collaboration_workspace_photo_77439975.png";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Advanced algorithms analyze skills, experience, and cultural fit to find perfect matches.",
    },
    {
      icon: Target,
      title: "Smart Job Recommendations",
      description: "Get personalized job suggestions based on your skills and career goals.",
    },
    {
      icon: TrendingUp,
      title: "Learning Roadmaps",
      description: "AI-generated learning paths help you acquire the skills you need.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                S
              </div>
              <span className="font-display font-semibold text-lg">SkillSync AI</span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a href="/features" className="text-sm font-medium" data-testid="link-features">Features</a>
              <a href="/pricing" className="text-sm font-medium" data-testid="link-pricing">Pricing</a>
              <a href="/resources" className="text-sm font-medium" data-testid="link-resources">Resources</a>
              <a href="/about" className="text-sm font-medium" data-testid="link-about">About</a>
              <a href="/contact" className="text-sm font-medium" data-testid="link-contact">Contact</a>
            </div>

            <a href="/api/login">
              <Button variant="default" size="default" data-testid="button-login">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight mb-6">
            Match the Right Talent
            <br />
            with the Right Opportunity
          </h1>

          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            SkillSync AI analyzes skills and project requirements, generates optimized learning roadmaps, 
            and automatically matches job-seekers with employers through intelligent AI-driven insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/api/login">
              <Button size="lg" variant="default" className="text-base px-8" data-testid="button-hero-signup">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Intelligent Hiring Made Simple
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Harness the power of AI to connect the right talent with the right opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 rounded-lg border bg-card hover-elevate">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands using SkillSync AI to find the perfect talent match
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
