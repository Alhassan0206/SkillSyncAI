import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TimeToHireData {
  stage: string;
  avgDays: number;
  color: string;
}

interface TimeToHireChartProps {
  data: TimeToHireData[];
  totalAvgDays: number;
}

export function TimeToHireChart({ data, totalAvgDays }: TimeToHireChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time to Hire</CardTitle>
        <CardDescription>
          Average days spent in each hiring stage • Total: {totalAvgDays} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" unit=" days" />
              <YAxis type="category" dataKey="stage" width={70} />
              <Tooltip
                formatter={(value: number) => [`${value} days`, 'Average Time']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

