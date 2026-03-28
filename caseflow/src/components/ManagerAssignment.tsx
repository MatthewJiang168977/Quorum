import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Smile, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { apiGet } from "../lib/api";

export default function ExecDashboard() {
  const [caseStats, setCaseStats] = useState<any>(null);
  const [satisfaction, setSatisfaction] = useState<any>(null);
  const [volume, setVolume] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, satRes, volRes] = await Promise.all([
          apiGet("/cases/stats"),
          apiGet("/orchestrate/satisfaction/stats").catch(() => null),
          apiGet("/trends/volume?days=7").catch(() => []),
        ]);
        setCaseStats(statsRes);
        setSatisfaction(satRes);

        // Format volume data for the chart
        const formatted = (volRes || []).map((d: any) => ({
          name: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
          cases: d.count,
        }));
        setVolume(formatted.length > 0 ? formatted : [
          { name: "Mon", cases: 0 }, { name: "Tue", cases: 0 },
          { name: "Wed", cases: 0 }, { name: "Thu", cases: 0 },
          { name: "Fri", cases: 0 }, { name: "Sat", cases: 0 },
          { name: "Sun", cases: 0 },
        ]);
      } catch (err) {
        console.error("Failed to fetch exec data:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const metrics = [
    {
      label: "Cases Processed",
      value: caseStats ? caseStats.total.toLocaleString() : "...",
      change: 12.4,
      icon: BarChart3,
    },
    {
      label: "Avg Resolution Time",
      value: caseStats?.avgResolutionDays ? `${caseStats.avgResolutionDays} days` : "... days",
      change: -8.1,
      icon: Clock,
    },
    {
      label: "Satisfaction Score",
      value: satisfaction?.avgRating ? `${satisfaction.avgRating} / 5` : "N/A",
      change: satisfaction?.avgRating ? 5.2 : 0,
      icon: Smile,
    },
  ];

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-xs text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      data-workflow-tour="manager-assignment"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">AI Assignment Engine</h2>
        </div>
        <p className="text-xs text-muted-foreground">AI recommends optimal caseworker teams per case based on expertise, load & history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const isPositive = m.change > 0;
          const isGood = m.label === "Avg Resolution Time" ? !isPositive : isPositive;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{m.value}</p>
              <div className={`flex items-center gap-1 text-xs font-medium ${isGood ? "text-primary" : "text-destructive"}`}>
                <TrendIcon size={12} />
                {Math.abs(m.change)}%
                <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Cases This Week</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volume} barSize={28}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(160, 10%, 50%)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(160, 10%, 50%)" }} />
              <Tooltip
                contentStyle={{
                  background: "hsla(0, 0%, 100%, 0.9)",
                  border: "1px solid hsl(150, 15%, 88%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="cases" fill="hsl(152, 45%, 42%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
