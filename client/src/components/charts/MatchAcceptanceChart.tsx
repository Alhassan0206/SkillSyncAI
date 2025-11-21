import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MatchAcceptanceData {
  name: string;
  value: number;
}

interface MatchAcceptanceChartProps {
  data: MatchAcceptanceData[];
}

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export function MatchAcceptanceChart({ data }: MatchAcceptanceChartProps) {
  const handleExport = () => {
    const totalCount = data.reduce((sum, item) => sum + item.value, 0);
    const exportData = data.map(item => ({
      Status: item.name,
      Count: item.value,
      Percentage: totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) + '%' : '0%'
    }));
    exportToCSV(exportData, 'match-acceptance-rates');
  };

  return (
    <Card data-testid="card-match-acceptance">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Match Acceptance Rates</CardTitle>
          <CardDescription>Application status distribution</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          data-testid="button-export-acceptance"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length > 0 && data.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No acceptance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
