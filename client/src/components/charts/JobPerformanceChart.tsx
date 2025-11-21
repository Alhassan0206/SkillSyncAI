import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface JobPerformanceData {
  title: string;
  applications: number;
  interviews: number;
  accepted: number;
}

interface JobPerformanceChartProps {
  data: JobPerformanceData[];
}

export function JobPerformanceChart({ data }: JobPerformanceChartProps) {
  const handleExport = () => {
    exportToCSV(data, 'job-performance');
  };

  return (
    <Card data-testid="card-job-performance-chart">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Job Performance Comparison</CardTitle>
          <CardDescription>Applications, interviews, and acceptances by job</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          data-testid="button-export-job-performance"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="title" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="applications" fill="hsl(var(--primary))" name="Applications" />
              <Bar dataKey="interviews" fill="hsl(var(--warning))" name="Interviews" />
              <Bar dataKey="accepted" fill="hsl(var(--success))" name="Accepted" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No job performance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
