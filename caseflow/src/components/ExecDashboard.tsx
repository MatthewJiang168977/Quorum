import { execMetrics, chartData, materialTypeBreakdown } from "@/lib/mockData";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Smile, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as PieTooltip,
} from "recharts";

const metrics = [
  {
    label: "Cases processed",
    value: execMetrics.casesProcessed.value.toLocaleString(),
    change: execMetrics.casesProcessed.change,
    icon: BarChart3,
  },
  {
    label: "Avg resolution time",
    value: `${execMetrics.avgResolutionTime.value} ${execMetrics.avgResolutionTime.unit}`,
    change: execMetrics.avgResolutionTime.change,
    icon: Clock,
  },
  {
    label: "Satisfaction score",
    value: `${execMetrics.satisfactionScore.value} / ${execMetrics.satisfactionScore.max}`,
    change: execMetrics.satisfactionScore.change,
    icon: Smile,
  },
];

export default function ExecDashboard() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Executive overview</h2>
        <p className="text-sm text-muted-foreground">Operational throughput and material mix across the portfolio</p>
      </motion.div>

      <div data-workflow-tour="exec-kpis" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const isPositive = m.change > 0;
          const isGood = m.label === "Avg resolution time" ? !isPositive : isPositive;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="surface-card rounded-xl p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              </div>
              <p className="mb-1 text-2xl font-bold tracking-tight text-foreground">{m.value}</p>
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${isGood ? "text-primary" : "text-destructive"}`}
              >
                <TrendIcon className="h-3 w-3" />
                {Math.abs(m.change)}%
                <span className="ml-1 font-normal text-muted-foreground">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div data-workflow-tour="exec-charts" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Material types per case</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Most-used evidence and filing types aggregated across active cases</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {materialTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <PieTooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                    background: "hsl(0 0% 100% / 0.95)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="surface-card rounded-xl p-5"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Cases this week</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.weekly} barSize={26}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100% / 0.95)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
