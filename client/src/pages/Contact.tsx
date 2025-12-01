import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import MarketingLayout from "@/components/MarketingLayout";

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

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Message Sent!",
          description: data.message || "We'll get back to you within 24 hours.",
        });
        setFormData({
          name: "",
          email: "",
          company: "",
          subject: "",
          message: "",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <MarketingLayout>
      <section className="pt-16 pb-16 px-6">
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
    </MarketingLayout>
  );
}
