import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              S
            </div>
            <span className="font-display font-semibold text-lg">SkillSync AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-features">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-pricing">
              Pricing
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-about">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-contact">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="default" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="default" size="default" data-testid="button-signup">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link href="/features" className="block px-3 py-2 text-sm font-medium hover-elevate rounded-md" data-testid="link-features-mobile">
              Features
            </Link>
            <Link href="/pricing" className="block px-3 py-2 text-sm font-medium hover-elevate rounded-md" data-testid="link-pricing-mobile">
              Pricing
            </Link>
            <Link href="/about" className="block px-3 py-2 text-sm font-medium hover-elevate rounded-md" data-testid="link-about-mobile">
              About
            </Link>
            <Link href="/contact" className="block px-3 py-2 text-sm font-medium hover-elevate rounded-md" data-testid="link-contact-mobile">
              Contact
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/login">
                <Button variant="ghost" className="w-full" data-testid="button-login-mobile">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" className="w-full" data-testid="button-signup-mobile">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
