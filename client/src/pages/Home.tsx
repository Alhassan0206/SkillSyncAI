import MarketingNav from "@/components/MarketingNav";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import PricingCard from "@/components/PricingCard";
import { Brain, Target, TrendingUp, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import resumeImage from "@assets/generated_images/Person_reviewing_resume_e9ad4146.png";
import interviewImage from "@assets/generated_images/Team_interview_scenario_f6587408.png";
import analyticsImage from "@assets/generated_images/Dashboard_analytics_on_laptop_e98f5f23.png";

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Advanced algorithms analyze skills, experience, and cultural fit to find perfect matches between candidates and opportunities.",
    },
    {
      icon: Target,
      title: "Smart Job Recommendations",
      description: "Get personalized job suggestions based on your skills, experience, and career goals with explainable AI insights.",
    },
    {
      icon: TrendingUp,
      title: "Learning Roadmaps",
      description: "AI-generated learning paths help you acquire the skills you need to reach your career goals faster.",
    },
    {
      icon: Users,
      title: "Talent Pipeline",
      description: "Build and manage a qualified talent pipeline with intelligent candidate screening and ranking.",
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamline your hiring process with automated candidate communication and interview scheduling.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance, data encryption, and GDPR-ready privacy controls.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individual job seekers",
      features: [
        "Create professional profile",
        "5 job matches per month",
        "Basic skill assessment",
        "Resume parser",
        "Email support",
      ],
    },
    {
      name: "Starter",
      price: "$29",
      description: "For small teams",
      features: [
        "Up to 5 job postings",
        "50 candidate matches/month",
        "Basic analytics",
        "Email notifications",
        "Standard support",
      ],
    },
    {
      name: "Growth",
      price: "$99",
      description: "For growing teams",
      popular: true,
      features: [
        "Unlimited job postings",
        "AI-powered candidate matching",
        "Advanced analytics dashboard",
        "Team collaboration tools",
        "Priority support",
        "GitHub integration",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Growth",
        "Dedicated account manager",
        "Custom integrations",
        "SSO & advanced security",
        "SLA guarantee",
        "Onboarding & training",
      ],
      ctaText: "Contact Sales",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <HeroSection />

      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Intelligent Hiring Made Simple
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Harness the power of AI to connect the right talent with the right opportunities,
              reducing time-to-hire and improving match quality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform makes hiring and job searching effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-6 rounded-lg overflow-hidden">
                <img 
                  src={resumeImage} 
                  alt="Upload your profile" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Create Your Profile</h3>
              <p className="text-muted-foreground">
                Upload your resume or create a profile. Our AI extracts skills and experience automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 rounded-lg overflow-hidden">
                <img 
                  src={analyticsImage} 
                  alt="Get matched" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Get Matched</h3>
              <p className="text-muted-foreground">
                Our AI analyzes thousands of data points to find your perfect match with explainable insights.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 rounded-lg overflow-hidden">
                <img 
                  src={interviewImage} 
                  alt="Start hiring" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Connect & Hire</h3>
              <p className="text-muted-foreground">
                Connect with top candidates or dream jobs, schedule interviews, and track your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-background" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 500+ companies using SkillSync AI to find the perfect talent
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-base px-8" data-testid="button-cta-signup">
                Get Started Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 bg-white/10 backdrop-blur-sm border-white/30 text-primary-foreground hover:bg-white/20" 
                data-testid="button-cta-contact"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  S
                </div>
                <span className="font-display font-semibold text-lg">SkillSync AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered skills matching for the modern workforce
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/features" className="hover:text-foreground">Features</a></li>
                <li><a href="/pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="/integrations" className="hover:text-foreground">Integrations</a></li>
                <li><a href="/api" className="hover:text-foreground">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground">About</a></li>
                <li><a href="/blog" className="hover:text-foreground">Blog</a></li>
                <li><a href="/careers" className="hover:text-foreground">Careers</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground">Terms</a></li>
                <li><a href="/security" className="hover:text-foreground">Security</a></li>
                <li><a href="/compliance" className="hover:text-foreground">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SkillSync AI. All rights reserved. SOC 2 Certified | GDPR Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
