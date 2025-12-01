import MarketingLayout from "@/components/MarketingLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  description: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "General",
    description: "Common questions about SkillSync AI",
    items: [
      {
        question: "What is SkillSync AI?",
        answer: "SkillSync AI is an AI-powered talent matching platform that connects job seekers with employers through intelligent skill analysis, personalized learning roadmaps, and automated matching algorithms. We use advanced machine learning to analyze skills, experience, and cultural fit to create perfect matches.",
      },
      {
        question: "Who can use SkillSync AI?",
        answer: "SkillSync AI serves two primary user groups: Job Seekers who want to find opportunities matching their skills and career goals, and Employers who want to efficiently find and hire the best talent. We also offer enterprise solutions for large organizations with complex hiring needs.",
      },
      {
        question: "How does AI matching work?",
        answer: "Our AI analyzes multiple factors including skills, experience, education, certifications, and career goals. We use semantic similarity algorithms to match candidate profiles with job requirements, providing a match score and detailed explanation of why each match was made.",
      },
      {
        question: "Is my data secure?",
        answer: "Yes, we take data security seriously. We use bank-level encryption, are GDPR compliant, and offer features like two-factor authentication. Your data is stored securely and never shared without your consent. See our Privacy Policy for full details.",
      },
    ],
  },
  {
    title: "For Job Seekers",
    description: "Questions from candidates and professionals",
    items: [
      {
        question: "Is SkillSync AI free for job seekers?",
        answer: "Yes! Job seekers can use SkillSync AI completely free. You can create a profile, upload your resume, get AI-powered skill analysis, receive job matches, and access personalized learning recommendations at no cost.",
      },
      {
        question: "How do I improve my match scores?",
        answer: "Complete your profile fully, add detailed skill descriptions, upload certifications and portfolio projects, and take skill assessments. Our AI uses all available information to create better matches. You can also follow the personalized learning paths we suggest to fill skill gaps.",
      },
      {
        question: "What is a Skill Passport?",
        answer: "Your Skill Passport is a verified record of your skills, including evidence like certifications, project work, endorsements from colleagues, and assessment results. It helps employers trust your claimed skills and can significantly improve your match scores.",
      },
      {
        question: "How do learning roadmaps work?",
        answer: "When we identify skill gaps between your current abilities and your target roles, we generate personalized learning roadmaps. These include recommended courses, tutorials, projects, and certifications to help you acquire the skills you need, with estimated timeframes for each milestone.",
      },
    ],
  },
  {
    title: "For Employers",
    description: "Questions from hiring teams and recruiters",
    items: [
      {
        question: "How much does it cost for employers?",
        answer: "We offer flexible pricing starting with a free tier for small teams (up to 3 job postings). Paid plans start at $49/month for startups and scale based on your hiring volume. Enterprise plans with custom pricing are available for large organizations. See our Pricing page for details.",
      },
      {
        question: "Can I integrate with my existing ATS?",
        answer: "Yes! We offer integrations with popular ATS platforms including Greenhouse, Lever, and Workday. We also provide a comprehensive API for custom integrations. Integration availability varies by plan level.",
      },
      {
        question: "How do team permissions work?",
        answer: "You can invite team members and assign roles like Admin, Recruiter, or Hiring Manager. Each role has different permissions for viewing candidates, managing jobs, and accessing settings. Enterprise plans include custom role creation.",
      },
      {
        question: "What analytics are available?",
        answer: "We provide comprehensive hiring analytics including time-to-hire metrics, candidate funnel analysis, source attribution, match quality tracking, and team performance reports. Advanced analytics and custom reports are available on Growth and Enterprise plans.",
      },
    ],
  },
  {
    title: "Billing & Plans",
    description: "Questions about pricing and subscriptions",
    items: [
      {
        question: "Can I change plans later?",
        answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle. We prorate charges for mid-cycle upgrades.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and can arrange invoice-based billing for Enterprise customers. All payments are processed securely through Stripe.",
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! All paid plans come with a 14-day free trial with full access to plan features. No credit card is required to start your trial. You can cancel anytime during the trial period.",
      },
      {
        question: "What happens when I reach my limits?",
        answer: "We'll notify you when you're approaching your plan limits (job postings, team members, API calls). You can upgrade at any time to unlock more capacity. We don't charge overage fees - you simply won't be able to add more until you upgrade.",
      },
      {
        question: "Do you offer discounts?",
        answer: "We offer special pricing for non-profit organizations, educational institutions, and startups in qualifying accelerator programs. We also offer annual billing discounts of 20%. Contact sales for details.",
      },
    ],
  },
  {
    title: "Technical & Integrations",
    description: "Questions about features and integrations",
    items: [
      {
        question: "What integrations are available?",
        answer: "We integrate with Slack (notifications), GitHub (developer profiles), Google Calendar (interview scheduling), and major ATS platforms. API access is available for custom integrations. Integration availability varies by plan.",
      },
      {
        question: "Do you have an API?",
        answer: "Yes! We offer a comprehensive REST API that allows you to integrate SkillSync AI into your existing tools and workflows. API access is included in Growth and Enterprise plans with usage limits based on your tier.",
      },
      {
        question: "Is there SSO/SAML support?",
        answer: "SSO/SAML authentication is available on Enterprise plans. We support integration with major identity providers including Okta, Azure AD, and Google Workspace.",
      },
      {
        question: "How do webhooks work?",
        answer: "Webhooks allow you to receive real-time notifications when events occur in SkillSync AI (new applications, status changes, etc.). You can configure webhook endpoints in your settings and subscribe to specific event types.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <MarketingLayout>
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about SkillSync AI. Can't find what you're looking for?{" "}
              <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
            </p>
          </div>

          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="scroll-mt-24" id={category.title.toLowerCase().replace(/\s+/g, '-')}>
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold mb-2">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border rounded-lg px-6 bg-card"
                      data-testid={`faq-${categoryIndex}-${itemIndex}`}
                    >
                      <AccordionTrigger className="text-left font-semibold hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 p-8 rounded-lg bg-primary text-primary-foreground text-center">
            <h2 className="font-display text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-lg mb-6 opacity-90">
              Our team is here to help. Get in touch and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="secondary" size="lg" data-testid="button-contact">
                  Contact Us
                </Button>
              </Link>
              <a href="/login">
                <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-get-started">
                  Get Started Free
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

