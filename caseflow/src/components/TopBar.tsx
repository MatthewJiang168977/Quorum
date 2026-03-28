import { Link, useLocation } from "react-router-dom";
import { Loader2, Plus, User, Zap } from "lucide-react";
import { Role } from "@/lib/mockData";
import { motion } from "framer-motion";
import NavbarPipeline from "@/components/NavbarPipeline";

interface TopBarProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  onNewCase: () => void;
  onRunWorkflow: () => void;
  workflowRunning?: boolean;
}

export default function TopBar({
  role,
  onRoleChange,
  onNewCase,
  onRunWorkflow,
  workflowRunning = false,
}: TopBarProps) {
  const location = useLocation();
  const onWorkspace = location.pathname.startsWith("/workspace");

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-border glass"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/" className="group flex shrink-0 items-baseline gap-2">
              <span className="text-[1.05rem] font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                Quorum
              </span>
              <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
                AI Workflows
              </span>
            </Link>
            <nav className="ml-1 flex items-center gap-1 text-[11px] font-medium sm:ml-2 sm:text-xs">
              <Link
                to="/"
                className={`rounded-md px-2 py-1 transition-colors ${location.pathname === "/" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Dashboard
              </Link>
              <Link
                to="/workspace"
                className={`rounded-md px-2 py-1 transition-colors ${onWorkspace ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Workspace
              </Link>
            </nav>
          </div>

          <div className="order-last flex w-full min-w-0 flex-[1_1_100%] items-center gap-2 sm:order-none sm:flex-1 sm:flex-[1_1_auto] lg:max-w-3xl">
            <button
              type="button"
              onClick={onRunWorkflow}
              disabled={workflowRunning}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/25 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-70"
            >
              {workflowRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Run workflow</span>
              <span className="sm:hidden">Run</span>
            </button>
            <NavbarPipeline
              role={role}
              onRoleChange={onRoleChange}
              disableInteraction={workflowRunning}
            />
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onNewCase}
              className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">New case</span>
            </button>

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm"
              aria-label="Account"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90 sm:text-[10px] sm:tracking-[0.22em]">
          <span className="inline sm:hidden">Tap a stage to switch views · Run walks all four</span>
          <span className="hidden sm:inline">
            Sync agents — click a stage to change view · Run workflow steps caseworker → manager → approver → executive
          </span>
        </p>
      </div>
    </motion.header>
  );
}
