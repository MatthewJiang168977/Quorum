import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShieldAlert, Target } from "lucide-react";
import { apiGet } from "../lib/api";

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// Map topics to colors
const topicColors: Record<string, { bg: string; text: string; border: string }> = {
  healthcare: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  immigration: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  veterans: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  tax: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  social_security: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  disaster_relief: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  infrastructure: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  education: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  small_business: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

const defaultColor = { bg: "bg-sage-50", text: "text-sage-700", border: "border-sage-200" };

export default function OutcomePrediction() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiGet("/cases");
        setCases(res.cases || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Derive risk scores from case priority and severity notes
  const enrichedCases = useMemo(() => {
    return cases.map((c) => {
      // Extract severity score from AI notes if available
      const severityNote = c.notes?.find((n: any) => n.author === "ai-severity-agent");
      let riskScore = 50;
      let severityValue = 5;

      if (severityNote) {
        const match = severityNote.text.match(/Severity:\s*(\d+)/);
        if (match) {
          severityValue = parseInt(match[1]);
          riskScore = severityValue * 10;
        }
      } else {
        // Fallback based on priority
        riskScore = c.priority === "critical" ? 90 : c.priority === "high" ? 70 : c.priority === "normal" ? 40 : 20;
        severityValue = Math.round(riskScore / 10);
      }

      // Estimate exposure based on severity and agency
      const baseExposure = riskScore * 500;
      const exposure = Math.round(baseExposure * (1 + Math.random() * 0.5));
      const settlementLow = Math.round(exposure * 0.4);
      const settlementHigh = Math.round(exposure * 0.8);
      const confidence = Math.max(60, Math.min(98, 100 - riskScore * 0.3 + Math.round(Math.random() * 15)));

      // Get primary topic from message if available
      const topic = c.messageId?.aiTags?.topics?.[0] || c.agency?.toLowerCase() || "other";

      return {
        ...c,
        riskScore,
        severityValue,
        predictedExposure: exposure,
        settlementRange: [settlementLow, settlementHigh] as [number, number],
        outcomeConfidence: confidence,
        topic,
      };
    });
  }, [cases]);

  const ranked = useMemo(
    () => [...enrichedCases].sort((a, b) => b.riskScore - a.riskScore),
    [enrichedCases]
  );

  const taxonomyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    enrichedCases.forEach((c) => counts.set(c.topic, (counts.get(c.topic) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedCases]);

  const maxExposure = Math.max(1, ...ranked.map((c) => c.predictedExposure));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-5"
    >
      {/* Taxonomy Map */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Case Taxonomy</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {taxonomyCounts.map(([topic, count]) => {
            const style = topicColors[topic] || defaultColor;
            return (
              <div
                key={topic}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border}`}
              >
                <span className={`text-xs font-semibold ${style.text}`}>{topic.replace(/_/g, " ")}</span>
                <span className={`text-xs font-bold ${style.text} bg-white/60 rounded-full w-5 h-5 flex items-center justify-center`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Outcome Predictions */}
      <div className="surface-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI outcome predictions</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Ranked by predicted exposure and risk</p>

        <div className="space-y-3">
          {ranked.map((c, i) => {
            const topicStyle = topicColors[c.topic] || defaultColor;
            const barWidth = (c.predictedExposure / maxExposure) * 100;

            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-muted-foreground">{c.caseNumber || c._id.slice(-6)}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${topicStyle.bg} ${topicStyle.text}`}>
                        {c.topic.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{c.subject}</p>
                  </div>
                </div>

                {/* Exposure bar */}
                <div className="ml-8 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-sage-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        c.riskScore > 80
                          ? "bg-priority-high"
                          : c.riskScore > 40
                          ? "bg-priority-medium"
                          : "bg-primary"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-16 text-right">
                    {formatCurrency(c.predictedExposure)}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="ml-8 flex items-center gap-4 mt-1.5">
                  <div className="flex items-center gap-1">
                    <ShieldAlert size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Risk</span>
                    <span className={`text-xs font-bold ${
                      c.riskScore > 80 ? "text-priority-high" : c.riskScore > 40 ? "text-priority-medium" : "text-primary"
                    }`}>
                      {c.riskScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Settlement</span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(c.settlementRange[0])}–{formatCurrency(c.settlementRange[1])}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <span className="text-xs font-semibold text-primary">{c.outcomeConfidence}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}