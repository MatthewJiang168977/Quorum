import { Fragment } from "react";
import { motion } from "framer-motion";
import { FileInput, Users, ShieldCheck, BarChart3 } from "lucide-react";
import type { Role } from "@/lib/mockData";

const stages: { id: Role; label: string; short: string; icon: typeof FileInput; ai: string }[] = [
  { id: "caseworker", label: "Case Worker", short: "CW", icon: FileInput, ai: "Intake" },
  { id: "manager", label: "Manager", short: "MG", icon: Users, ai: "Assignment" },
  { id: "approver", label: "Approver", short: "AP", icon: ShieldCheck, ai: "Approval" },
  { id: "exec", label: "Executive", short: "EX", icon: BarChart3, ai: "Oversight" },
];

const roleIndex: Record<Role, number> = {
  caseworker: 0,
  manager: 1,
  approver: 2,
  exec: 3,
};

interface NavbarPipelineProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  disableInteraction?: boolean;
  className?: string;
}

export default function NavbarPipeline({
  role,
  onRoleChange,
  disableInteraction = false,
  className = "",
}: NavbarPipelineProps) {
  const currentIndex = roleIndex[role];

  return (
    <div
      className={`flex min-w-0 flex-1 items-center justify-center gap-0 ${className}`}
      role="tablist"
      aria-label="Role view — case worker through executive"
    >
      {stages.map((stage, i) => {
        const isActive = i === currentIndex;
        const Icon = stage.icon;

        return (
          <Fragment key={stage.id}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disableInteraction}
              onClick={() => onRoleChange(stage.id)}
              className={`group flex min-w-0 flex-1 flex-col items-center rounded-xl px-0.5 py-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-60 sm:px-1.5 ${
                isActive ? "bg-primary/12 ring-1 ring-primary/35" : "hover:bg-muted/40"
              }`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={isActive ? { repeat: Infinity, duration: 2.6 } : {}}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all sm:h-9 sm:w-9 ${
                  isActive
                    ? "border-foreground/25 bg-primary text-primary-foreground pipeline-glow"
                    : "border-border bg-card text-muted-foreground group-hover:border-primary group-hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
              </motion.div>
              <span
                className={`mt-1 max-w-[4.75rem] truncate text-center text-[9px] font-semibold leading-tight sm:max-w-[5.5rem] sm:text-[10px] ${
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/90"
                }`}
              >
                {stage.label}
              </span>
              <span className="mt-0.5 hidden text-[8px] font-medium text-primary/80 sm:block">{stage.ai}</span>
            </button>

            {i < stages.length - 1 && (
              <div
                className="h-0.5 w-6 min-w-[12px] flex-1 max-w-[48px] self-start rounded-full bg-muted sm:mt-5 sm:w-auto"
                aria-hidden
              >
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{
                    width: currentIndex > i ? "100%" : currentIndex === i ? "52%" : "0%",
                  }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
