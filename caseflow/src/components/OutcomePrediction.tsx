import { mockCases, taxonomyColors } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import CaseClassificationVisual from "@/components/CaseClassificationVisual";

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function OutcomePrediction() {
  const ranked = useMemo(
    () => [...mockCases].sort((a, b) => b.riskScore - a.riskScore),
    []
  );

  const maxExposure = Math.max(1, ...ranked.map((c) => c.predictedExposure));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-5"
    >
      <CaseClassificationVisual />

      {/* AI Outcome Predictions */}
      <div data-workflow-tour="outcome-predictions" className="surface-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI outcome predictions</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Ranked by predicted exposure and risk</p>

        <div className="space-y-3">
          {ranked.map((c, i) => {
            const taxStyle = taxonomyColors[c.topic];
            const barWidth = (c.predictedExposure / maxExposure) * 100;

            return (
              <motion.div
                key={c.id}
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
                      <span className="text-xs font-medium text-muted-foreground">{c.id}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${taxStyle.bg} ${taxStyle.text}`}>
                        {c.topic}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
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
