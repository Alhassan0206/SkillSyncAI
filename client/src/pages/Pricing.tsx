import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, X } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Up to 3 active job postings",
        "Basic AI matching",
        "10 matches per month",
        "Email support",
        "Basic analytics",
      ],
      limitations: [
        "No team collaboration",
        "No integrations",
        "No advanced analytics",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      description: "For small teams and startups",
      features: [
        "Up to 10 active job postings",
        "Advanced AI matching",
        "Unlimited matches",
        "Priority email support",
        "Advanced analytics",
        "Up to 3 team members",
        "Slack integration",
        "Resume parsing",
      ],
      limitations: [
        "No GitHub integration",
        "No SSO/SAML",
      ],
      cta: "Start 14-Day Trial",
      highlight: false,
    },
    {
      name: "Growth",
      price: "$149",
      period: "per month",
      description: "For growing companies",
      features: [
        "Unlimited job postings",
        "Premium AI matching",
        "Unlimited matches",
        "Priority support + Slack",
        "Advanced analytics + exports",
        "Up to 10 team members",
        "All integrations (Slack, GitHub, Calendar)",
        "Resume parsing",
        "Learning roadmaps",
        "API access (1,000 calls/month)",
        "Custom branding",
      ],
      limitations: [
        "Limited API calls",
      ],
      cta: "Start 14-Day Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      description: "For large organizations",
      features: [
        "Everything in Growth",
        "Unlimited team members",
        "Dedicated account manager",
        "24/7 phone support",
        "SSO/SAML authentication",
        "Advanced security & compliance",
        "Unlimited API calls",
        "Custom integrations",
        "Multi-region deployment",
        "SLA guarantees",
        "On-premise option",
      ],
      limitations: [],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate the difference.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express) and can arrange invoice-based billing for Enterprise customers.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start.",
    },
    {
      question: "What happens when I reach my limits?",
      answer: "We'll notify you when you're approaching your plan limits. You can upgrade at any time to unlock more capacity.",
    },
    {
      question: "Do you offer discounts for non-profits?",
      answer: "Yes! We offer special pricing for non-profit organizations and educational institutions. Contact sales for details.",
    },
    {
      question: "What's included in support?",
      answer: "All plans include email support. Paid plans get priority support, and Enterprise customers receive dedicated 24/7 phone support.",
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that's right for your team. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card"
                }`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold mb-4 text-primary-foreground">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period !== "contact sales" && (
                    <span className={`text-sm ml-2 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      / {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <a href={plan.name === "Enterprise" ? "/contact" : "/api/login"}>
                  <Button
                    variant={plan.highlight ? "secondary" : "default"}
                    className="w-full mb-6"
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </a>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm opacity-50">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="p-6 rounded-lg border bg-card" data-testid={`faq-${index}`}>
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
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
