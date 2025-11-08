import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "hello@skillsync.ai",
      link: "mailto:hello@skillsync.ai",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+1 (555) 123-4567",
      link: "tel:+15551234567",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "San Francisco, CA",
      link: "#",
    },
    {
      icon: MessageSquare,
      title: "Support",
      value: "support@skillsync.ai",
      link: "mailto:support@skillsync.ai",
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
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      data-testid="input-company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      data-testid="input-subject"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    data-testid="textarea-message"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <a
                        key={index}
                        href={info.link}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover-elevate"
                        data-testid={`contact-info-${index}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{info.title}</h3>
                          <p className="text-sm text-muted-foreground">{info.value}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-lg bg-primary text-primary-foreground">
                <h3 className="font-display text-xl font-bold mb-3">Enterprise Sales</h3>
                <p className="mb-4 opacity-90">
                  Looking for a custom plan for your organization? Our sales team is ready to help.
                </p>
                <Button variant="secondary" className="w-full" data-testid="button-enterprise">
                  Schedule a Demo
                </Button>
              </div>

              <div className="p-6 rounded-lg border bg-card">
                <h3 className="font-display text-xl font-bold mb-3">Support</h3>
                <p className="text-muted-foreground mb-4">
                  Need help with your account? Visit our help center or contact support.
                </p>
                <Link href="/resources">
                  <a>
                    <Button variant="outline" className="w-full" data-testid="button-help-center">
                      Visit Help Center
                    </Button>
                  </a>
                </Link>
              </div>
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
