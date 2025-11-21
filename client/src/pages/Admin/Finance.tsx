import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, Users, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { exportToCSV } from "@/lib/csvExport";

export default function Finance() {
  const { data: stats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/tenants'],
  });

  const { data: revenueAggregates, isLoading: revenueLoading } = useQuery<any[]>({
    queryKey: ['/api/analytics/revenue', { aggregated: true }],
  });

  const isLoading = tenantsLoading || revenueLoading;

  const activeTenants = tenants?.filter(t => t.status === 'active') || [];
  const currentMonth = revenueAggregates?.[revenueAggregates.length - 1];
  const lastMonth = revenueAggregates?.[revenueAggregates.length - 2];
  
  const mrr = currentMonth?.totalRevenue || 0;
  const mrrChange = lastMonth?.totalRevenue 
    ? (((mrr - lastMonth.totalRevenue) / lastMonth.totalRevenue) * 100).toFixed(1)
    : '0';
  
  const ytdRevenue = revenueAggregates?.reduce((sum, month) => sum + (month.totalRevenue || 0), 0) || 0;
  const activeSubscriptions = currentMonth?.activeSubscriptions || activeTenants.length;
  const arpu = activeSubscriptions > 0 ? (mrr / activeSubscriptions).toFixed(0) : '0';

  const mrrChangeType: "positive" | "negative" = parseFloat(mrrChange) >= 0 ? "positive" : "negative";

  const revenueMetrics = [
    {
      title: "Monthly Recurring Revenue",
      value: `$${mrr.toFixed(0)}`,
      change: `${mrrChange}%`,
      changeType: mrrChangeType,
      icon: DollarSign,
    },
    {
      title: "Total Revenue (YTD)",
      value: `$${ytdRevenue.toFixed(0)}`,
      change: `${revenueAggregates?.length || 0} months`,
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.toString(),
      change: `${currentMonth?.newSubscriptions || 0} new`,
      changeType: "positive" as const,
      icon: CreditCard,
    },
    {
      title: "Average Revenue Per User",
      value: `$${arpu}`,
      change: "per month",
      changeType: "neutral" as const,
      icon: Users,
    },
  ];

  const planCounts = {
    free: activeTenants.filter(t => t.plan === 'free').length,
    starter: activeTenants.filter(t => t.plan === 'starter').length,
    professional: activeTenants.filter(t => t.plan === 'professional').length,
    enterprise: activeTenants.filter(t => t.plan === 'enterprise').length,
  };

  const planPricing = { free: 0, starter: 150, professional: 600, enterprise: 1275 };
  const totalCount = Object.values(planCounts).reduce((a, b) => a + b, 0);

  const planBreakdown = [
    { 
      plan: "Free", 
      count: planCounts.free, 
      revenue: `$${planCounts.free * planPricing.free}`, 
      percentage: totalCount > 0 ? Math.round((planCounts.free / totalCount) * 100) : 0 
    },
    { 
      plan: "Starter", 
      count: planCounts.starter, 
      revenue: `$${planCounts.starter * planPricing.starter}`, 
      percentage: totalCount > 0 ? Math.round((planCounts.starter / totalCount) * 100) : 0 
    },
    { 
      plan: "Professional", 
      count: planCounts.professional, 
      revenue: `$${planCounts.professional * planPricing.professional}`, 
      percentage: totalCount > 0 ? Math.round((planCounts.professional / totalCount) * 100) : 0 
    },
    { 
      plan: "Enterprise", 
      count: planCounts.enterprise, 
      revenue: `$${planCounts.enterprise * planPricing.enterprise}`, 
      percentage: totalCount > 0 ? Math.round((planCounts.enterprise / totalCount) * 100) : 0 
    },
  ];

  const revenueChartData = (revenueAggregates || []).map((month: any) => ({
    month: new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: month.totalRevenue || 0,
    subscriptions: month.activeSubscriptions || 0,
  }));

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Finance & Revenue"
        subtitle="Track subscription revenue and financial metrics"
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading revenue data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {revenueMetrics.map((metric) => (
            <Card key={metric.title} data-testid={`card-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <metric.icon className="w-5 h-5 text-muted-foreground" />
                  <Badge 
                    variant={metric.changeType === "positive" ? "secondary" : metric.changeType === "negative" ? "destructive" : "secondary"} 
                    className={metric.changeType === "positive" ? "bg-success/10 text-success" : ""}
                  >
                    {metric.change}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{metric.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {revenueChartData.length > 0 && <RevenueChart data={revenueChartData} />}

        <Card data-testid="card-plan-breakdown">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Revenue by Plan</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(planBreakdown, 'plan-breakdown')}
              data-testid="button-export-plan-breakdown"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planBreakdown.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{plan.plan}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{plan.count} subscribers</span>
                        <span className="font-semibold">{plan.revenue}</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card data-testid="card-subscriber-growth">
            <CardHeader>
              <CardTitle>Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">New This Month</span>
                  <span className="font-medium text-success">{currentMonth?.newSubscriptions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Canceled This Month</span>
                  <span className="font-medium text-destructive">{currentMonth?.canceledSubscriptions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Net Growth</span>
                  <span className="font-medium">
                    {(currentMonth?.newSubscriptions || 0) - (currentMonth?.canceledSubscriptions || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue-metrics">
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Order Value</span>
                  <span className="font-medium">${arpu}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Active Plans</span>
                  <span className="font-medium">{activeTenants.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revenue Growth Rate</span>
                  <span className={`font-medium ${parseFloat(mrrChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {mrrChange}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
