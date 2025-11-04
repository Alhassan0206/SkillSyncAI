import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText?: string;
}

export default function PricingCard({ 
  name, 
  price, 
  period = "month", 
  description, 
  features, 
  popular = false,
  ctaText = "Get Started"
}: PricingCardProps) {
  return (
    <Card className={`p-8 relative ${popular ? 'border-2 border-primary shadow-lg' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <div className="mb-6">
        <h3 className="text-2xl font-semibold mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold">{price}</span>
          {price !== "Custom" && <span className="text-muted-foreground">/{period}</span>}
        </div>
      </div>

      <Button 
        variant={popular ? "default" : "outline"} 
        className="w-full mb-8" 
        size="lg"
        data-testid={`button-pricing-${name.toLowerCase()}`}
      >
        {ctaText}
      </Button>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
