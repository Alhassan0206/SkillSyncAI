import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Finance() {
  const { data: stats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const revenueMetrics = [
    {
      title: "Monthly Recurring Revenue",
      value: "$12,450",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Revenue (YTD)",
      value: "$89,200",
      change: "+23.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Active Subscriptions",
      value: "47",
      change: "+8",
      changeType: "positive" as const,
      icon: CreditCard,
    },
    {
      title: "Average Revenue Per User",
      value: "$265",
      change: "+5.2%",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  const planBreakdown = [
    { plan: "Free", count: 15, revenue: "$0", percentage: 32 },
    { plan: "Starter", count: 18, revenue: "$2,700", percentage: 38 },
    { plan: "Professional", count: 12, revenue: "$7,200", percentage: 26 },
    { plan: "Enterprise", count: 2, revenue: "$2,550", percentage: 4 },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Finance & Revenue"
        subtitle="Track subscription revenue and financial metrics"
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {revenueMetrics.map((metric) => (
            <Card key={metric.title} data-testid={`card-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <metric.icon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant={metric.changeType === "positive" ? "secondary" : "destructive"} className={metric.changeType === "positive" ? "bg-success/10 text-success" : ""}>
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

        <Card data-testid="card-plan-breakdown">
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
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
          <Card data-testid="card-payment-methods">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Credit Card</span>
                  <span className="font-medium">42 (89%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">PayPal</span>
                  <span className="font-medium">5 (11%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-churn-rate">
            <CardHeader>
              <CardTitle>Churn & Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monthly Churn Rate</span>
                  <span className="font-medium text-success">2.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Lifetime Value</span>
                  <span className="font-medium">$3,180</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
