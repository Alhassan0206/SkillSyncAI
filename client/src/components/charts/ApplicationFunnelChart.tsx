import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";
import { Funnel, FunnelChart, LabelList, ResponsiveContainer } from "recharts";

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

interface ApplicationFunnelChartProps {
  data: FunnelData[];
}

export function ApplicationFunnelChartComponent({ data }: ApplicationFunnelChartProps) {
  const handleExport = () => {
    const totalCount = data[0]?.value || 0;
    const exportData = data.map(item => ({
      Stage: item.name,
      Count: item.value,
      Percentage: totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) + '%' : '0%',
      'Conversion Rate': totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : '0'
    }));
    exportToCSV(exportData, 'application-funnel');
  };

  return (
    <Card data-testid="card-application-funnel">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>Candidate progression through stages</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          data-testid="button-export-funnel"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length > 0 && data.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive
              >
                <LabelList
                  position="right"
                  fill="#000"
                  stroke="none"
                  dataKey="name"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No funnel data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
