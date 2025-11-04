import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_collaboration_workspace_photo_77439975.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">AI-Powered Skills Matching</span>
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight mb-6">
          Match the Right Talent
          <br />
          with the Right Opportunity
        </h1>

        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
          SkillSync AI analyzes skills and project requirements, generates optimized learning roadmaps, and automatically matches job-seekers with employers through intelligent AI-driven insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" variant="default" className="text-base px-8" data-testid="button-hero-signup">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" 
              data-testid="button-hero-demo"
            >
              Watch Demo
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-white/80 text-sm">
          <p className="mb-4">Trusted by 500+ companies worldwide</p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            <div className="text-2xl font-semibold">TechCorp</div>
            <div className="text-2xl font-semibold">InnovateLabs</div>
            <div className="text-2xl font-semibold">GlobalHire</div>
            <div className="text-2xl font-semibold">FutureWork</div>
          </div>
        </div>
      </div>
    </section>
  );
}
