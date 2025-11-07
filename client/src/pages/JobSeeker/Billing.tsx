import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Calendar, AlertCircle, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function JobSeekerBilling() {
  const { user } = useAuth() as any;

  const { data: billingStatus, isLoading } = useQuery<any>({
    queryKey: ['/api/job-seeker/billing/status'],
  });

  const getPlanBadge = () => {
    if (billingStatus?.hasSubscription && billingStatus?.subscription?.status === 'active') {
      return <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">Pro Plan</Badge>;
    }
    return <Badge variant="secondary">Free Plan</Badge>;
  };

  const features = [
    { name: "AI-Powered Job Matching", free: true, pro: true },
    { name: "Skill Gap Analysis", free: true, pro: true },
    { name: "Learning Roadmaps", free: "Limited", pro: true },
    { name: "Resume Parsing", free: true, pro: true },
    { name: "Job Applications", free: "5/month", pro: "Unlimited" },
    { name: "Priority Support", free: false, pro: true },
    { name: "Advanced Analytics", free: false, pro: true },
  ];

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Job Seeker" 
        notificationCount={0}
        rolePrefix="/dashboard"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Billing & Subscription</h2>
            <p className="text-muted-foreground">Manage your subscription and plan</p>
          </div>

          {!isLoading && billingStatus && !billingStatus.stripeConfigured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Billing is not fully configured yet. Contact support for subscription options.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Current Plan
                  </CardTitle>
                  {getPlanBadge()}
                </div>
                <CardDescription>Your current subscription status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan Type</span>
                      <span className="font-medium">
                        {billingStatus?.hasSubscription ? "Pro" : "Free"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {billingStatus?.hasSubscription ? "$29/month" : "$0/month"}
                      </span>
                    </div>
                    {billingStatus?.subscription?.current_period_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Renewal Date</span>
                        <span className="font-medium">
                          {new Date(billingStatus.subscription.current_period_end * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Upgrade to Pro
                </CardTitle>
                <CardDescription>Unlock premium features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">$29<span className="text-lg text-muted-foreground">/month</span></div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Unlimited job applications
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Advanced analytics dashboard
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Priority support
                    </li>
                  </ul>
                  {!billingStatus?.hasSubscription && billingStatus?.stripeConfigured && (
                    <Button className="w-full" data-testid="button-upgrade">
                      Upgrade Now
                    </Button>
                  )}
                  {billingStatus?.hasSubscription && (
                    <Button variant="outline" className="w-full" data-testid="button-manage">
                      Manage Subscription
                    </Button>
                  )}
                  {!billingStatus?.stripeConfigured && (
                    <Button variant="outline" className="w-full" disabled data-testid="button-upgrade-disabled">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>See what's included in each plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-2 border-b font-semibold">
                  <div>Feature</div>
                  <div className="text-center">Free</div>
                  <div className="text-center">Pro</div>
                </div>
                {features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-sm">{feature.name}</div>
                    <div className="text-center">
                      {feature.free === true ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                      ) : feature.free === false ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{feature.free}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {feature.pro === true ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-sm">{feature.pro}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
