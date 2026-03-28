import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseItem, mockCases, Role } from "@/lib/mockData";
import TopBar from "@/components/TopBar";
import CaseCard from "@/components/CaseCard";
import CaseDetail from "@/components/CaseDetail";
import IntakeModal from "@/components/IntakeModal";
import ExecDashboard from "@/components/ExecDashboard";
import TaskList from "@/components/TaskList";
import CaseCalendar from "@/components/CaseCalendar";
import OutcomePrediction from "@/components/OutcomePrediction";
import AIWorkbench from "@/components/AIWorkbench";
import ManagerAssignment from "@/components/ManagerAssignment";
import WorkflowTourInvite from "@/components/WorkflowTourInvite";
import WorkflowTourSpotlight from "@/components/WorkflowTourSpotlight";
import WorkflowRunChoiceDialog from "@/components/WorkflowRunChoiceDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WORKFLOW_ORDER, WORKFLOW_STEP_MS } from "@/lib/workflowSequence";
import { WORKFLOW_TOUR_STEPS } from "@/lib/workflowTour";

const TOUR_AUTO_ADVANCE_MS = 5200;
const TOUR_DISMISS_KEY = "quorum-workflow-tour-dismissed";

const AGENT_LABELS: Record<Role, string> = {
  caseworker: "Intake & triage agent",
  manager: "Assignment optimizer",
  approver: "Draft & compliance agent",
  exec: "Executive signals agent",
};

export default function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("exec");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [runChoiceOpen, setRunChoiceOpen] = useState(false);
  const [tourInviteDismissed, setTourInviteDismissed] = useState(() => {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem(TOUR_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const filteredCases = useMemo(() => {
    switch (role) {
      case "caseworker":
        return mockCases.filter((c) => c.assignee === "Sarah Chen");
      case "approver":
        return mockCases.filter((c) => c.status === "needs-approval");
      default:
        return mockCases;
    }
  }, [role]);

  const handleAction = (action: string) => {
    toast.success(`Action: ${action}`, {
      description: `Case ${selectedCase?.id} — ${action} completed.`,
    });
    setSelectedCase(null);
  };

  const tourStep = tourActive ? WORKFLOW_TOUR_STEPS[tourStepIndex] ?? null : null;

  useEffect(() => {
    if (!tourActive) return;
    const step = WORKFLOW_TOUR_STEPS[tourStepIndex];
    if (step) setRole(step.role);
  }, [tourActive, tourStepIndex]);

  useEffect(() => {
    if (!tourActive) return;
    const t = window.setTimeout(() => {
      if (tourStepIndex >= WORKFLOW_TOUR_STEPS.length - 1) {
        setTourActive(false);
        toast.success("Guided workflow complete", {
          description: "You can restart the tour anytime from the banner if you clear site data or use a fresh session.",
        });
      } else {
        setTourStepIndex((i) => i + 1);
      }
    }, TOUR_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [tourActive, tourStepIndex]);

  const startTour = useCallback(() => {
    setTourStepIndex(0);
    setTourActive(true);
  }, []);

  const dismissTourInvite = useCallback(() => {
    try {
      localStorage.setItem(TOUR_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setTourInviteDismissed(true);
  }, []);

  const tourNext = useCallback(() => {
    if (tourStepIndex >= WORKFLOW_TOUR_STEPS.length - 1) {
      setTourActive(false);
      toast.success("Guided workflow complete");
    } else {
      setTourStepIndex((i) => i + 1);
    }
  }, [tourStepIndex]);

  const tourSkip = useCallback(() => {
    setTourActive(false);
  }, []);

  useEffect(() => {
    const st = location.state as { startGuidedTour?: boolean } | undefined;
    if (!st?.startGuidedTour) return;
    setTourStepIndex(0);
    setTourActive(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const runWorkflowNormal = useCallback(() => {
    if (tourActive) return;
    setWorkflowRunning(true);
    WORKFLOW_ORDER.forEach((r, i) => {
      window.setTimeout(() => {
        setRole(r);
        toast.message(`Synced: ${AGENT_LABELS[r]}`, {
          description: `Stage ${i + 1} of ${WORKFLOW_ORDER.length} — workspace switched to match this agent.`,
        });
        if (i === WORKFLOW_ORDER.length - 1) {
          setWorkflowRunning(false);
          toast.success("Workflow run complete", {
            description: "All agents synced — executive view is active.",
          });
        }
      }, WORKFLOW_STEP_MS * i);
    });
  }, [tourActive]);

  const openRunWorkflowChoice = useCallback(() => {
    if (tourActive) return;
    setRunChoiceOpen(true);
  }, [tourActive]);

  const roleHeading: Record<Role, { title: string; subtitle: string }> = {
    caseworker: { title: "My cases", subtitle: "Your assigned cases — intake, analyze, and work" },
    manager: { title: "Team assignment", subtitle: "AI-powered caseworker assignment and oversight" },
    approver: { title: "Review and predict", subtitle: "AI outcome predictions — approve or escalate" },
    exec: { title: "Executive overview", subtitle: "KPI dashboard and strategic oversight" },
  };

  return (
    <div className="min-h-screen pb-16">
      <TopBar
        role={role}
        onRoleChange={setRole}
        onNewCase={() => setIntakeOpen(true)}
        onRunWorkflow={openRunWorkflowChoice}
        workflowRunning={workflowRunning}
        tourActive={tourActive}
      />

      <WorkflowRunChoiceDialog
        open={runChoiceOpen}
        onOpenChange={setRunChoiceOpen}
        isWorkspace
        onGuided={() => {
          setTourStepIndex(0);
          setTourActive(true);
        }}
        onNormal={runWorkflowNormal}
      />

      <WorkflowTourSpotlight
        active={tourActive}
        step={tourStep}
        stepIndex={tourStepIndex}
        totalSteps={WORKFLOW_TOUR_STEPS.length}
        appRole={role}
        onNext={tourNext}
        onSkip={tourSkip}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <WorkflowTourInvite
          visible={!tourInviteDismissed && !tourActive && !workflowRunning}
          onStart={startTour}
          onDismiss={dismissTourInvite}
        />

        <motion.div
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{roleHeading[role].title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-balance-safe">{roleHeading[role].subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {role === "caseworker" && (
              <motion.div key="cw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <AIWorkbench />
                <div data-workflow-tour="case-cards" className="grid max-w-3xl grid-cols-1 gap-4">
                  {filteredCases.map((c, i) => (
                    <CaseCard key={c.id} caseItem={c} onClick={() => setSelectedCase(c)} index={i} />
                  ))}
                  {filteredCases.length === 0 && (
                    <div className="py-16 text-center">
                      <p className="text-sm text-muted-foreground">No cases assigned to you.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {role === "manager" && (
              <motion.div key="mgr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <ManagerAssignment />
                <div data-workflow-tour="case-cards" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredCases.map((c, i) => (
                    <CaseCard key={c.id} caseItem={c} onClick={() => setSelectedCase(c)} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {role === "approver" && (
              <motion.div key="apr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <OutcomePrediction />
                <div data-workflow-tour="case-cards" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredCases.map((c, i) => (
                    <CaseCard key={c.id} caseItem={c} onClick={() => setSelectedCase(c)} index={i} />
                  ))}
                  {filteredCases.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                      <p className="text-sm text-muted-foreground">No cases awaiting approval.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {role === "exec" && (
              <motion.div key="exec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <ExecDashboard />
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <TaskList role={role} />
            <CaseCalendar />
          </div>
        </div>
      </main>

      <CaseDetail caseItem={selectedCase} onClose={() => setSelectedCase(null)} onAction={handleAction} />
      <IntakeModal isOpen={intakeOpen} onClose={() => setIntakeOpen(false)} />
    </div>
  );
}
