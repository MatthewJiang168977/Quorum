export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "in-progress" | "needs-approval" | "resolved";
export type Role = "caseworker" | "manager" | "approver" | "exec";
export type Taxonomy = "Housing" | "Environmental" | "Benefits" | "Infrastructure" | "Compliance" | "Permits" | "Employment" | "Civil Rights";

/** Groupings for approver case-classification mind-map (each taxonomy maps to one bucket) */
export const classificationBuckets: {
  id: string;
  label: string;
  topics: Taxonomy[];
  primaryHex: string;
  childHex: string;
}[] = [
  {
    id: "housing",
    label: "Housing & social",
    topics: ["Housing", "Civil Rights"],
    primaryHex: "#1e40af",
    childHex: "#93c5fd",
  },
  {
    id: "economic",
    label: "Benefits & workforce",
    topics: ["Benefits", "Employment"],
    primaryHex: "#c2410c",
    childHex: "#fcd34d",
  },
  {
    id: "risk",
    label: "Compliance & environment",
    topics: ["Compliance", "Environmental"],
    primaryHex: "#b91c1c",
    childHex: "#fca5a5",
  },
  {
    id: "works",
    label: "Infrastructure & permits",
    topics: ["Infrastructure", "Permits"],
    primaryHex: "#0f766e",
    childHex: "#5eead4",
  },
];

export const taxonomyColors: Record<Taxonomy, { bg: string; text: string; border: string }> = {
  Housing: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Environmental: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Benefits: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Infrastructure: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  Compliance: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Permits: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Employment: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Civil Rights": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
};

export interface CaseItem {
  id: string;
  title: string;
  priority: Priority;
  assignee: string | null;
  status: Status;
  topic: Taxonomy;
  problem: string;
  aiReason: string;
  recommendedAssignee: string;
  assigneeReason: string;
  nextStep: string;
  createdAt: string;
  notes: string[];
  predictedExposure: number;
  settlementRange: [number, number];
  outcomeConfidence: number;
  riskScore: number;
}

export interface RoleTask {
  id: string;
  label: string;
  done: boolean;
  caseId?: string;
  dueDate?: string;
}

export const roleTasks: Record<Role, RoleTask[]> = {
  caseworker: [
    { id: "cw1", label: "Follow up on QR-1042 inspection", done: false, caseId: "QR-1042", dueDate: "2026-03-28" },
    { id: "cw2", label: "Upload evidence for QR-1046", done: false, caseId: "QR-1046", dueDate: "2026-03-29" },
    { id: "cw3", label: "Complete site visit notes — 14th St", done: false, dueDate: "2026-03-30" },
    { id: "cw4", label: "Log ADA assessment outcome", done: false, caseId: "QR-1046", dueDate: "2026-03-31" },
    { id: "cw5", label: "Contact tenant association", done: true, caseId: "QR-1042" },
    { id: "cw6", label: "Sync field notes to CRM", done: false, dueDate: "2026-03-28" },
  ],
  manager: [
    { id: "mg1", label: "Review AI assignment for QR-1043", done: false, caseId: "QR-1043", dueDate: "2026-03-28" },
    { id: "mg2", label: "Approve fast-track QR-1044", done: false, caseId: "QR-1044", dueDate: "2026-03-28" },
    { id: "mg3", label: "Rebalance caseload — unassigned queue", done: false, dueDate: "2026-03-29" },
    { id: "mg4", label: "Escalation report for housing violations", done: false, dueDate: "2026-03-29" },
    { id: "mg5", label: "1:1 with Priya on benefits backlog", done: false, dueDate: "2026-04-01" },
    { id: "mg6", label: "Weekly caseload review", done: true },
  ],
  approver: [
    { id: "ap1", label: "Sign legislative reply drafts (batch 12)", done: false, dueDate: "2026-03-28" },
    { id: "ap2", label: "Dual review — Rodriguez benefits QR-1044", done: false, caseId: "QR-1044", dueDate: "2026-03-28" },
    { id: "ap3", label: "Approve inspection sign-off package", done: false, dueDate: "2026-03-29" },
    { id: "ap4", label: "Redline high-risk exposure memo", done: false, caseId: "QR-1042", dueDate: "2026-03-30" },
    { id: "ap5", label: "Archive approved correspondence set", done: true },
  ],
  exec: [
    { id: "ex1", label: "Board briefing — constituent volume", done: false, dueDate: "2026-03-30" },
    { id: "ex2", label: "Approve Q2 hiring & AI vendor spend", done: false, dueDate: "2026-04-01" },
    { id: "ex3", label: "Policy council — response SLAs", done: false, dueDate: "2026-04-02" },
    { id: "ex4", label: "Review crisis comms playbook update", done: false, dueDate: "2026-04-03" },
    { id: "ex5", label: "Sign off on monthly KPI packet", done: true, dueDate: "2026-03-27" },
  ],
};

/** Channel mix for analytics / homepage */
export const channelBreakdown = [
  { name: "Email", value: 45, fill: "#819A91" },
  { name: "Social Media", value: 25, fill: "#A7C1A8" },
  { name: "Forms / Mail", value: 20, fill: "#D1D8BE" },
  { name: "Voicemail", value: 10, fill: "#5c7a72" },
];

/** Most-used materials per case (executive pie) */
export const materialTypeBreakdown = [
  { name: "Written testimony", value: 32, fill: "#819A91" },
  { name: "Photos / exhibits", value: 28, fill: "#A7C1A8" },
  { name: "Agency correspondence", value: 22, fill: "#D1D8BE" },
  { name: "Audio / video", value: 12, fill: "#6b8f83" },
  { name: "Forms & filings", value: 6, fill: "#c4d4c5" },
];

export const sentimentTrendSeries = [
  { week: "W1", positive: 42, negative: 24, neutral: 31 },
  { week: "W2", positive: 45, negative: 22, neutral: 33 },
  { week: "W3", positive: 48, negative: 26, neutral: 30 },
  { week: "W4", positive: 52, negative: 28, neutral: 32 },
  { week: "W5", positive: 55, negative: 25, neutral: 34 },
  { week: "W6", positive: 50, negative: 27, neutral: 35 },
];

export const messageVolumeWeek = [
  { day: "Mon", inbound: 118, outbound: 92, ai: 44 },
  { day: "Tue", inbound: 132, outbound: 101, ai: 52 },
  { day: "Wed", inbound: 124, outbound: 98, ai: 48 },
  { day: "Thu", inbound: 141, outbound: 110, ai: 58 },
  { day: "Fri", inbound: 128, outbound: 95, ai: 51 },
  { day: "Sat", inbound: 64, outbound: 38, ai: 22 },
  { day: "Sun", inbound: 52, outbound: 31, ai: 18 },
];

export const homeKpis = [
  { label: "Total Messages", value: "2,847", delta: "+12%", sub: "this week", icon: "mail" as const },
  { label: "Pending Drafts", value: "34", delta: "8 urgent", sub: "awaiting edit", icon: "draft" as const },
  { label: "Awaiting Approval", value: "12", delta: null, sub: "legislative queue", icon: "clock" as const },
  { label: "Resolved Today", value: "89", delta: "+23%", sub: "vs yesterday", icon: "check" as const },
];

export interface OrchestrationAgent {
  id: string;
  name: string;
  role: Role;
  status: "idle" | "running" | "queued";
  lastSync: string;
  description: string;
}

export const orchestrationAgents: OrchestrationAgent[] = [
  {
    id: "a1",
    name: "Intake & triage",
    role: "caseworker",
    status: "running",
    lastSync: "2m ago",
    description: "Classifies channel, urgency, and suggested route.",
  },
  {
    id: "a2",
    name: "Assignment optimizer",
    role: "manager",
    status: "idle",
    lastSync: "14m ago",
    description: "Matches caseload to staff skills and SLAs.",
  },
  {
    id: "a3",
    name: "Draft & compliance",
    role: "approver",
    status: "queued",
    lastSync: "1h ago",
    description: "Generates replies and flags policy conflicts.",
  },
  {
    id: "a4",
    name: "Executive signals",
    role: "exec",
    status: "idle",
    lastSync: "32m ago",
    description: "Rolls up KPIs, risk, and anomaly alerts.",
  },
];

export const marketDemandSignals = [
  { topic: "Housing & code enforcement", demandIndex: 94, change: "+18%", note: "Spike in mold / ADA complaints" },
  { topic: "Benefits & SNAP", demandIndex: 81, change: "+6%", note: "Seasonal enrollment window" },
  { topic: "Infrastructure / permits", demandIndex: 62, change: "-4%", note: "Backlog clearing after storm work" },
  { topic: "Environmental noise", demandIndex: 58, change: "+11%", note: "Industrial zone petitions" },
];

export const topTopicsBars = [
  { topic: "Healthcare", pct: 78 },
  { topic: "Infrastructure", pct: 64 },
  { topic: "Education", pct: 52 },
  { topic: "Housing", pct: 48 },
  { topic: "Benefits", pct: 41 },
];

export const recentMessagesFeed = [
  { id: "m1", subject: "Medicare billing dispute — follow-up", from: "Jane Mitchell", channel: "Email", sentiment: "negative" as const, priority: "high" as const, ago: "12 min ago" },
  { id: "m2", subject: "Praise for field office staff", from: "Community Board 4", channel: "Social", sentiment: "positive" as const, priority: "low" as const, ago: "28 min ago" },
  { id: "m3", subject: "Permit status — Oak Ave closure", from: "Local Business Assoc.", channel: "Form", sentiment: "neutral" as const, priority: "medium" as const, ago: "41 min ago" },
  { id: "m4", subject: "Urgent: water main break", from: "Alex R.", channel: "Voicemail", sentiment: "negative" as const, priority: "high" as const, ago: "55 min ago" },
  { id: "m5", subject: "Scholarship program inquiry", from: "Parent coalition", channel: "Email", sentiment: "positive" as const, priority: "low" as const, ago: "1h ago" },
];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  caseId?: string;
  type: "deadline" | "hearing" | "inspection" | "review" | "meeting";
}

export const calendarEvents: CalendarEvent[] = [
  { id: "e1", title: "Emergency inspection — 14th St", date: "2026-03-28", caseId: "QR-1042", type: "inspection" },
  { id: "e2", title: "Benefits review deadline", date: "2026-03-28", caseId: "QR-1044", type: "deadline" },
  { id: "e3", title: "Noise complaint hearing", date: "2026-03-29", caseId: "QR-1043", type: "hearing" },
  { id: "e4", title: "ADA site assessment", date: "2026-03-29", caseId: "QR-1046", type: "inspection" },
  { id: "e5", title: "Weekly team standup", date: "2026-03-30", type: "meeting" },
  { id: "e6", title: "Permit follow-up", date: "2026-03-31", caseId: "QR-1047", type: "review" },
  { id: "e7", title: "Housing violation review", date: "2026-04-01", caseId: "QR-1042", type: "review" },
  { id: "e8", title: "Quarterly case audit", date: "2026-04-03", type: "meeting" },
];

export const eventTypeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  deadline: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  hearing: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  inspection: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  review: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  meeting: { bg: "bg-sage-100", text: "text-sage-700", dot: "bg-sage-500" },
};

export const mockCases: CaseItem[] = [
  {
    id: "QR-1042",
    title: "Housing Code Violation — 14th St Complex",
    priority: "high",
    assignee: "Sarah Chen",
    status: "in-progress",
    topic: "Housing",
    problem: "Tenant reports persistent mold and water damage in units 3A-3F. Building inspection overdue by 90 days.",
    aiReason: "Urgent housing violation affecting 6 units. Health risk escalation likely within 2 weeks.",
    recommendedAssignee: "Sarah Chen",
    assigneeReason: "12 similar cases resolved. Currently available. Highest success rate in housing violations.",
    nextStep: "Schedule emergency inspection + notify building management",
    createdAt: "2026-03-27",
    notes: ["Tenant association filed formal complaint", "Previous violation on record from 2025"],
    predictedExposure: 285000,
    settlementRange: [120000, 210000],
    outcomeConfidence: 87,
    riskScore: 92,
  },
  {
    id: "QR-1043",
    title: "Noise Complaint — Industrial Zone B",
    priority: "medium",
    assignee: null,
    status: "pending",
    topic: "Environmental",
    problem: "Multiple residents report excessive noise from construction site operating outside permitted hours.",
    aiReason: "Repeated violation. 3rd complaint this month. Regulatory action threshold reached.",
    recommendedAssignee: "Marcus Webb",
    assigneeReason: "Environmental specialist. Handled 8 similar industrial noise cases.",
    nextStep: "Assign + issue warning notice",
    createdAt: "2026-03-28",
    notes: [],
    predictedExposure: 45000,
    settlementRange: [15000, 30000],
    outcomeConfidence: 72,
    riskScore: 54,
  },
  {
    id: "QR-1044",
    title: "Benefits Application — Rodriguez Family",
    priority: "medium",
    assignee: "Priya Patel",
    status: "needs-approval",
    topic: "Benefits",
    problem: "Family of 5 applying for emergency housing assistance. Income verification completed.",
    aiReason: "Meets all eligibility criteria. Fast-track eligible due to minor children.",
    recommendedAssignee: "Priya Patel",
    assigneeReason: "Benefits specialist. Currently managing similar caseload.",
    nextStep: "Manager approval required for fast-track processing",
    createdAt: "2026-03-26",
    notes: ["Income docs verified", "School enrollment confirmed for 3 children"],
    predictedExposure: 18000,
    settlementRange: [12000, 18000],
    outcomeConfidence: 94,
    riskScore: 22,
  },
  {
    id: "QR-1045",
    title: "Street Light Outage — Oak Ave",
    priority: "low",
    assignee: "James Torres",
    status: "in-progress",
    topic: "Infrastructure",
    problem: "Cluster of 4 street lights non-functional on Oak Avenue between 5th and 8th Street.",
    aiReason: "Standard maintenance request. No safety incidents reported yet.",
    recommendedAssignee: "James Torres",
    assigneeReason: "Infrastructure team lead. Area falls in assigned zone.",
    nextStep: "Dispatch maintenance crew",
    createdAt: "2026-03-25",
    notes: ["Work order created"],
    predictedExposure: 8500,
    settlementRange: [3000, 6000],
    outcomeConfidence: 91,
    riskScore: 12,
  },
  {
    id: "QR-1046",
    title: "Accessibility Complaint — City Hall Annex",
    priority: "high",
    assignee: null,
    status: "pending",
    topic: "Compliance",
    problem: "Wheelchair ramp at south entrance non-compliant with ADA standards. Visitor reported injury.",
    aiReason: "ADA violation with injury report. Legal liability risk. Immediate remediation required.",
    recommendedAssignee: "Sarah Chen",
    assigneeReason: "Compliance certified. Fastest response time for ADA cases.",
    nextStep: "Assign + arrange emergency site assessment",
    createdAt: "2026-03-28",
    notes: ["Incident report filed", "Photo evidence uploaded"],
    predictedExposure: 520000,
    settlementRange: [180000, 380000],
    outcomeConfidence: 78,
    riskScore: 96,
  },
  {
    id: "QR-1047",
    title: "Permit Delay — Community Garden Project",
    priority: "low",
    assignee: "Marcus Webb",
    status: "in-progress",
    topic: "Permits",
    problem: "Community garden permit application pending for 45 days. Standard processing time is 21 days.",
    aiReason: "Overdue but low urgency. No dependencies or escalation triggers.",
    recommendedAssignee: "Marcus Webb",
    assigneeReason: "Currently assigned. Has context on the application.",
    nextStep: "Follow up with permits office",
    createdAt: "2026-03-20",
    notes: ["Applicant notified of delay"],
    predictedExposure: 2500,
    settlementRange: [0, 1500],
    outcomeConfidence: 96,
    riskScore: 5,
  },
];

export const execMetrics = {
  casesProcessed: { value: 1247, change: 12.4 },
  avgResolutionTime: { value: 3.2, unit: "days", change: -8.1 },
  satisfactionScore: { value: 4.6, max: 5, change: 5.2 },
};

export const chartData = {
  weekly: [
    { name: "Mon", cases: 32 },
    { name: "Tue", cases: 45 },
    { name: "Wed", cases: 28 },
    { name: "Thu", cases: 51 },
    { name: "Fri", cases: 39 },
    { name: "Sat", cases: 12 },
    { name: "Sun", cases: 8 },
  ],
};
