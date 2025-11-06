import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Calendar, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function EmployerBilling() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: billingStatus, isLoading } = useQuery<any>({
    queryKey: ['/api/employer/billing/status'],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Subscription activated!",
        description: "Your payment was successful. Welcome to SkillSync AI Pro!",
      });
      window.history.replaceState({}, '', '/employer/billing');
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Subscription canceled",
        description: "You can upgrade anytime you're ready.",
      });
      window.history.replaceState({}, '', '/employer/billing');
    }
  }, [location, toast]);

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/employer/billing/create-checkout');
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
      const res = await apiRequest('POST', '/api/employer/billing/create-portal');
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
    return <Badge variant="secondary">Free Trial</Badge>;
  };

  const getPlanPrice = () => {
    if (billingStatus?.hasSubscription && billingStatus?.subscription?.status === 'active') {
      return '$99/month';
    }
    return '$0/month';
  };

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Billing & Subscription</h2>
            <p className="text-muted-foreground">Manage your subscription and payment methods</p>
          </div>

          {!billingStatus?.configured && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Billing is not configured. Contact your administrator to enable subscription features.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <CardTitle>Current Plan</CardTitle>
                </div>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  {getPlanBadge()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-lg font-semibold">{getPlanPrice()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Job Postings</span>
                  <span className="text-sm font-medium">Unlimited</span>
                </div>
                {billingStatus?.hasSubscription && billingStatus?.subscription?.status === 'active' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renews on</span>
                    <span className="text-sm font-medium">
                      {new Date((billingStatus.subscription.currentPeriodEnd || 0) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {!billingStatus?.hasSubscription && billingStatus?.configured && (
                  <Button 
                    className="w-full" 
                    onClick={() => upgradeMutation.mutate()}
                    disabled={upgradeMutation.isPending}
                    data-testid="button-upgrade-plan"
                  >
                    {upgradeMutation.isPending ? (
                      "Loading..."
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                )}
                {billingStatus?.hasSubscription && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    data-testid="button-manage-subscription"
                  >
                    {portalMutation.isPending ? (
                      "Loading..."
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <CardTitle>Payment Method</CardTitle>
                </div>
                <CardDescription>Manage payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {billingStatus?.hasSubscription ? (
                  <>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">Payment method on file</p>
                          <p className="text-xs text-muted-foreground">Managed via Stripe</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                      data-testid="button-update-payment"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Update Payment Method
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="py-8 text-center text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No payment method on file</p>
                    </div>
                    {billingStatus?.configured && (
                      <Button 
                        className="w-full" 
                        onClick={() => upgradeMutation.mutate()}
                        disabled={upgradeMutation.isPending}
                        data-testid="button-add-payment"
                      >
                        Add Payment Method
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <CardTitle>Billing History</CardTitle>
              </div>
              <CardDescription>Your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                {billingStatus?.hasSubscription ? (
                  <div className="space-y-2">
                    <p>View your billing history in the Stripe Customer Portal</p>
                    <Button 
                      variant="outline" 
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Stripe
                    </Button>
                  </div>
                ) : (
                  <p>No billing history available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
