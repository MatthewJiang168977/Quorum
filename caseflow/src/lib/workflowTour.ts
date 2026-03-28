import type { Role } from "@/lib/mockData";

export interface WorkflowTourStep {
  role: Role;
  /** Matches [data-workflow-tour] on the page */
  target: string;
  agent: string;
  title: string;
  body: string;
}

/** Order: pipeline intro → each role’s main surfaces → executive sidebar */
export const WORKFLOW_TOUR_STEPS: WorkflowTourStep[] = [
  {
    role: "caseworker",
    target: "workflow-pipeline",
    agent: "Orchestrator",
    title: "Workflow stages",
    body: "These stages mirror how work flows from intake through executive oversight. The tour will jump to each role view next.",
  },
  {
    role: "caseworker",
    target: "ai-workbench",
    agent: "Intake & triage agent",
    title: "AI Workbench",
    body: "Multimodal analysis, live agent, and drafts — this is where evidence is processed before cases move forward.",
  },
  {
    role: "caseworker",
    target: "case-cards",
    agent: "Intake & triage agent",
    title: "Your cases",
    body: "Assigned matters appear here for triage, updates, and field follow-up.",
  },
  {
    role: "manager",
    target: "manager-assignment",
    agent: "Assignment optimizer",
    title: "AI assignment engine",
    body: "Load balancing and recommended caseworkers per case based on expertise and capacity.",
  },
  {
    role: "manager",
    target: "case-cards",
    agent: "Assignment optimizer",
    title: "Team queue",
    body: "Open cases the pod can assign or reassign as priorities shift.",
  },
  {
    role: "approver",
    target: "case-classification",
    agent: "Draft & compliance agent",
    title: "Case classification",
    body: "Live taxonomy map — the model’s routing and volume by category for approval decisions.",
  },
  {
    role: "approver",
    target: "outcome-predictions",
    agent: "Draft & compliance agent",
    title: "Outcome predictions",
    body: "Exposure, risk, and confidence ranked for sign-off and escalation.",
  },
  {
    role: "exec",
    target: "exec-kpis",
    agent: "Executive signals agent",
    title: "Portfolio KPIs",
    body: "Throughput, resolution time, and satisfaction at a glance.",
  },
  {
    role: "exec",
    target: "exec-charts",
    agent: "Executive signals agent",
    title: "Material mix & volume",
    body: "Evidence types and weekly caseload for board-ready reporting.",
  },
  {
    role: "exec",
    target: "task-sidebar",
    agent: "Executive signals agent",
    title: "Strategic tasks",
    body: "Your executive action list stays visible while you review metrics.",
  },
];
