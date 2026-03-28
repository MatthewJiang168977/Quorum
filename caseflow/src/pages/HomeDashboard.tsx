import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import {
  channelBreakdown,
  homeKpis,
  marketDemandSignals,
  messageVolumeWeek,
  orchestrationAgents,
  recentMessagesFeed,
  sentimentTrendSeries,
  topTopicsBars,
  type Role,
} from "@/lib/mockData";
import { WORKFLOW_ORDER, WORKFLOW_STEP_MS } from "@/lib/workflowSequence";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
  Legend,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
} from "recharts";
import { ArrowUpRight, Bot, Mail, MessageSquare, Clock, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "sentiment", label: "Sentiment" },
  { id: "topics", label: "Topics" },
  { id: "ai", label: "AI performance" },
] as const;

const AGENT_LABELS: Record<Role, string> = {
  caseworker: "Intake & triage agent",
  manager: "Assignment optimizer",
  approver: "Draft & compliance agent",
  exec: "Executive signals agent",
};

const dashboardLens: Record<Role, string> = {
  caseworker:
    "Intake-focused lens — constituent volume, field follow-ups, and evidence queues tied to your desk.",
  manager: "Team lens — assignment load, escalations, and AI routing health across the pod.",
  approver: "Approval lens — drafts awaiting sign-off, exposure, and compliance-sensitive traffic.",
  exec: "Executive lens — portfolio KPIs, demand signals, and orchestration readiness.",
};

function KpiIcon({ kind }: { kind: (typeof homeKpis)[number]["icon"] }) {
  if (kind === "mail") return <Mail className="h-4 w-4" />;
  if (kind === "draft") return <MessageSquare className="h-4 w-4" />;
  if (kind === "clock") return <Clock className="h-4 w-4" />;
  return <CheckCircle2 className="h-4 w-4" />;
}

export default function HomeDashboard() {
  const [role, setRole] = useState<Role>("caseworker");
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [workflowRunning, setWorkflowRunning] = useState(false);

  const runWorkflow = useCallback(() => {
    setWorkflowRunning(true);
    WORKFLOW_ORDER.forEach((r, i) => {
      window.setTimeout(() => {
        setRole(r);
        toast.message(`Synced: ${AGENT_LABELS[r]}`, {
          description: `Stage ${i + 1} of ${WORKFLOW_ORDER.length} — dashboard lens updated.`,
        });
        if (i === WORKFLOW_ORDER.length - 1) {
          setWorkflowRunning(false);
          toast.success("Workflow run complete", {
            description: "All four lenses synced — executive view is active.",
          });
        }
      }, WORKFLOW_STEP_MS * i);
    });
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <TopBar
        role={role}
        onRoleChange={setRole}
        onNewCase={() => toast.message("New case", { description: "Open workspace to create a case." })}
        onRunWorkflow={runWorkflow}
        workflowRunning={workflowRunning}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Constituent intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{dashboardLens[role]}</p>
        </motion.div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {homeKpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="surface-card rounded-xl p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <KpiIcon kind={k.icon} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{k.value}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {k.delta && (
                  <span className="font-semibold text-primary">
                    <TrendingUp className="mr-0.5 inline h-3 w-3" />
                    {k.delta}
                  </span>
                )}
                <span className="text-muted-foreground">{k.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
          <Link
            to="/workspace"
            className="ml-auto inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
          >
            Open workspace
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card rounded-2xl p-6 xl:col-span-2"
            >
              <h2 className="text-sm font-semibold text-foreground">Message volume — this week</h2>
              <p className="mb-4 text-xs text-muted-foreground">Inbound, outbound, and AI-assisted touches</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={messageVolumeWeek}>
                    <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                        background: "hsl(0 0% 100% / 0.96)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="inbound" fill="#819A91" radius={[4, 4, 0, 0]} name="Inbound" />
                    <Line type="monotone" dataKey="outbound" stroke="#A7C1A8" strokeWidth={2} dot={false} name="Outbound" />
                    <Line type="monotone" dataKey="ai" stroke="#5c7a72" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-foreground">Channel breakdown</h2>
              <p className="mb-2 text-xs text-muted-foreground">Where constituents reach you</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelBreakdown} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                      {channelBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <PieTooltip
                      contentStyle={{
                        borderRadius: "10px",
                        fontSize: "12px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}

        {tab === "sentiment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground">Sentiment trends — 8 weeks</h2>
            <p className="mb-4 text-xs text-muted-foreground">Smoothed constituent sentiment streams</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sentimentTrendSeries}>
                  <defs>
                    <linearGradient id="gpos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A7C1A8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#A7C1A8" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gneg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c47070" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#c47070" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Area type="monotone" dataKey="positive" stroke="#6b8f83" fill="url(#gpos)" strokeWidth={2} name="Positive" />
                  <Area type="monotone" dataKey="negative" stroke="#b45353" fill="url(#gneg)" strokeWidth={2} name="Negative" />
                  <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Neutral" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {tab === "topics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Top topics</h2>
            <div className="space-y-4">
              {topTopicsBars.map((row) => (
                <div key={row.topic}>
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span>{row.topic}</span>
                    <span className="text-muted-foreground">{row.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "ai" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-foreground">Model throughput</h2>
              <p className="mb-4 text-xs text-muted-foreground">Drafts generated vs. human edits (mock)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Mon", ai: 120, human: 40 },
                      { name: "Tue", ai: 132, human: 38 },
                      { name: "Wed", ai: 118, human: 44 },
                      { name: "Thu", ai: 141, human: 36 },
                      { name: "Fri", ai: 128, human: 41 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "12px" }} />
                    <Bar dataKey="ai" fill="#819A91" radius={[4, 4, 0, 0]} name="AI drafts" />
                    <Bar dataKey="human" fill="#D1D8BE" radius={[4, 4, 0, 0]} name="Human edits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="surface-card flex flex-col justify-center rounded-2xl p-6">
              <Sparkles className="mb-2 h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">AI performance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                First-contact resolution is up 6.2% after tightening retrieval on housing precedents. Use{" "}
                <strong className="text-foreground">Run workflow</strong> in the header to push policy bundles to every agent role.
              </p>
            </div>
          </motion.div>
        )}

        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="surface-card rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Agent orchestration</h2>
                <p className="text-xs text-muted-foreground">Status mesh for each role-aligned agent</p>
              </div>
            </div>
            <div className="space-y-3">
              {orchestrationAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                  <div className="text-right text-[10px] font-medium uppercase tracking-wide">
                    <span
                      className={
                        agent.status === "running"
                          ? "text-primary"
                          : agent.status === "queued"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      }
                    >
                      {agent.status}
                    </span>
                    <p className="mt-1 font-normal text-muted-foreground">{agent.lastSync}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="surface-card rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Market need & constituent demand</h2>
                <p className="text-xs text-muted-foreground">Where pressure is building this quarter</p>
              </div>
            </div>
            <div className="space-y-3">
              {marketDemandSignals.map((m) => (
                <div key={m.topic} className="rounded-xl border border-border bg-gradient-to-r from-primary/8 to-transparent px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{m.topic}</p>
                    <span className="shrink-0 text-xs font-bold text-primary">{m.demandIndex}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{m.change}</span>
                    <span>{m.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mt-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Recent messages</h2>
            <div className="divide-y divide-border/60">
              {recentMessagesFeed.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.from} · {row.channel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        row.sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : row.sentiment === "positive"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.sentiment}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        row.priority === "high"
                          ? "bg-amber-100 text-amber-900"
                          : row.priority === "medium"
                            ? "bg-sky-100 text-sky-900"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.ago}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
