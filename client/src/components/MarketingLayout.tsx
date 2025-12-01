import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/resources", label: "Resources" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                S
              </div>
              <span className="font-display font-semibold text-lg">SkillSync AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium hover:text-primary transition-colors"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
              <a href="/login">
                <Button variant="default" size="default" data-testid="button-login">
                  Get Started
                </Button>
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              data-testid="button-mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium hover:bg-muted rounded-md"
                  data-testid={`link-${link.label.toLowerCase()}-mobile`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 px-3">
                <a href="/login" className="block">
                  <Button variant="default" className="w-full" data-testid="button-login-mobile">
                    Get Started
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  S
                </div>
                <span className="font-display font-semibold text-lg">SkillSync AI</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered talent matching for modern hiring teams.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/case-studies" className="hover:text-foreground transition-colors">Case Studies</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} SkillSync AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

