import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Calendar, AlertCircle, Sparkles, CheckCircle, ExternalLink, FileText, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface UsageItem {
  featureType: string;
  used: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentUsed: number;
}

interface UsageData {
  periodMonth: string;
  plan: string;
  usage: UsageItem[];
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

export default function JobSeekerBilling() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: billingStatus, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/job-seeker/billing/status'],
  });

  const { data: invoicesData } = useQuery<{ invoices: Invoice[]; stripeConfigured: boolean }>({
    queryKey: ['/api/billing/invoices'],
  });

  const { data: usageData } = useQuery<UsageData>({
    queryKey: ['/api/usage'],
  });

  // Handle redirect from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Subscription activated!",
        description: "Your payment was successful. Welcome to SkillSync AI Pro!",
      });
      window.history.replaceState({}, '', '/dashboard/billing');
      refetch();
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Subscription canceled",
        description: "You can upgrade anytime you're ready.",
      });
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [location, toast, refetch]);

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/job-seeker/billing/create-checkout', { planId: 'seeker_pro' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/job-seeker/billing/create-portal');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    },
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
                    <Button
                      className="w-full"
                      onClick={() => upgradeMutation.mutate()}
                      disabled={upgradeMutation.isPending}
                      data-testid="button-upgrade"
                    >
                      {upgradeMutation.isPending ? "Loading..." : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade Now
                        </>
                      )}
                    </Button>
                  )}
                  {billingStatus?.hasSubscription && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                      data-testid="button-manage"
                    >
                      {portalMutation.isPending ? "Loading..." : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Manage Subscription
                        </>
                      )}
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

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <CardTitle>Billing History</CardTitle>
              </div>
              <CardDescription>Your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {!invoicesData?.stripeConfigured ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Billing not configured</p>
                </div>
              ) : invoicesData?.invoices?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No billing history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoicesData?.invoices?.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Invoice #{invoice.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.created * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${(invoice.amountPaid / 100).toFixed(2)}
                          </p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                        {invoice.invoicePdf && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Dashboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <CardTitle>Usage This Month</CardTitle>
              </div>
              <CardDescription>
                Track your feature usage for {usageData?.periodMonth || 'this billing period'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageData?.usage ? (
                <div className="space-y-4">
                  {usageData.usage
                    .filter(item => item.limit !== 0) // Hide features with 0 limit
                    .map((item) => {
                      const featureLabels: Record<string, string> = {
                        job_posting: 'Job Postings',
                        application: 'Applications',
                        ai_match: 'AI Matches',
                        ai_test: 'AI Skill Tests',
                        resume_parse: 'Resume Parses',
                        webhook_call: 'Webhook Calls',
                        api_call: 'API Calls',
                      };

                      const isUnlimited = item.limit === 'unlimited';
                      const isNearLimit = !isUnlimited && item.percentUsed >= 80;
                      const isAtLimit = !isUnlimited && item.percentUsed >= 100;

                      return (
                        <div key={item.featureType} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {featureLabels[item.featureType] || item.featureType}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {item.used} / {isUnlimited ? '∞' : item.limit}
                              {isAtLimit && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Limit Reached
                                </Badge>
                              )}
                              {isNearLimit && !isAtLimit && (
                                <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                                  Near Limit
                                </Badge>
                              )}
                            </span>
                          </div>
                          <Progress
                            value={isUnlimited ? 0 : Math.min(item.percentUsed, 100)}
                            className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
                          />
                        </div>
                      );
                    })}

                  {!billingStatus?.hasSubscription && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Need more?</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Upgrade to Pro for unlimited applications, AI matches, and advanced features.
                          </p>
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => upgradeMutation.mutate()}
                            disabled={upgradeMutation.isPending}
                          >
                            Upgrade Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No usage data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
