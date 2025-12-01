import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, FileText, Video, TrendingUp, Users, Code, Brain } from "lucide-react";

export default function Resources() {
  const caseStudies = [
    {
      company: "TechCorp Inc.",
      industry: "Technology",
      title: "How TechCorp Reduced Time-to-Hire by 60%",
      description: "Learn how TechCorp used SkillSync AI to streamline their hiring process and find better candidates faster.",
      metrics: [
        { label: "Time Saved", value: "60%" },
        { label: "Match Quality", value: "+45%" },
        { label: "Cost Reduction", value: "$250K/year" },
      ],
    },
    {
      company: "StartupXYZ",
      industry: "Fintech",
      title: "Building a World-Class Team with AI",
      description: "How a fast-growing fintech startup scaled their team from 10 to 100 employees using intelligent matching.",
      metrics: [
        { label: "Hires Made", value: "90" },
        { label: "Acceptance Rate", value: "85%" },
        { label: "Hiring Speed", value: "3x faster" },
      ],
    },
    {
      company: "Global Enterprises",
      industry: "Consulting",
      title: "Enterprise-Scale Talent Matching",
      description: "A Fortune 500 company's journey to modernize their recruiting with SkillSync AI across 50+ countries.",
      metrics: [
        { label: "Users", value: "500+" },
        { label: "Jobs Filled", value: "2,000+" },
        { label: "Satisfaction", value: "4.8/5" },
      ],
    },
  ];

  const blogPosts = [
    {
      icon: TrendingUp,
      category: "Best Practices",
      title: "10 Tips for Writing Job Descriptions That Attract Top Talent",
      excerpt: "Learn how to craft compelling job postings that resonate with the best candidates.",
      readTime: "5 min read",
    },
    {
      icon: Brain,
      category: "AI & Technology",
      title: "How AI is Transforming the Hiring Process",
      excerpt: "Explore the latest advances in AI-powered recruiting and what they mean for your organization.",
      readTime: "8 min read",
    },
    {
      icon: Users,
      category: "Team Building",
      title: "Building Diverse Teams: Reducing Bias in Hiring",
      excerpt: "Practical strategies for creating more inclusive hiring processes using data and AI.",
      readTime: "6 min read",
    },
    {
      icon: Code,
      category: "Developer Guide",
      title: "Getting Started with the SkillSync API",
      excerpt: "A comprehensive guide to integrating SkillSync AI into your existing tools and workflows.",
      readTime: "10 min read",
    },
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Help Center",
      description: "Comprehensive guides and documentation to help you get the most out of SkillSync AI.",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs of key features and best practices.",
    },
    {
      icon: FileText,
      title: "API Documentation",
      description: "Complete API reference and integration guides for developers.",
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
              Resources & Learning
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to succeed with SkillSync AI, from case studies to technical documentation.
            </p>
          </div>

          <div className="mb-24">
            <h2 className="font-display text-3xl font-bold mb-8">Case Studies</h2>
            <div className="grid lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div key={index} className="p-6 rounded-lg border bg-card hover-elevate" data-testid={`case-study-${index}`}>
                  <div className="text-sm text-primary font-medium mb-2">{study.industry}</div>
                  <h3 className="text-xl font-semibold mb-3">{study.title}</h3>
                  <p className="text-muted-foreground mb-6">{study.description}</p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {study.metrics.map((metric, i) => (
                      <div key={i} className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
                        <div className="text-xs text-muted-foreground">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" data-testid={`button-read-case-${index}`}>
                    Read Full Case Study
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-24">
            <h2 className="font-display text-3xl font-bold mb-8">Latest from Our Blog</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post, index) => {
                const Icon = post.icon;
                return (
                  <div key={index} className="p-6 rounded-lg border bg-card hover-elevate" data-testid={`blog-post-${index}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">{post.category}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                      <Button variant="ghost" size="sm" data-testid={`button-read-blog-${index}`}>
                        Read More →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-24">
            <h2 className="font-display text-3xl font-bold mb-8">Additional Resources</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {resources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <div key={index} className="p-6 rounded-lg border bg-card text-center" data-testid={`resource-${index}`}>
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{resource.title}</h3>
                    <p className="text-muted-foreground mb-6">{resource.description}</p>
                    <Button variant="outline" data-testid={`button-resource-${index}`}>
                      Explore
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="p-8 rounded-lg bg-primary text-primary-foreground text-center">
              <h2 className="font-display text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of companies transforming their hiring with AI
              </p>
              <a href="/login">
                <Button variant="secondary" size="lg" data-testid="button-cta">
                  Start Free Trial
                </Button>
              </a>
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
