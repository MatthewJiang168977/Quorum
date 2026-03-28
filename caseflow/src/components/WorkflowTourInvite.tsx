import { motion } from "framer-motion";
import { Sparkles, Play, X } from "lucide-react";

interface WorkflowTourInviteProps {
  visible: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

export default function WorkflowTourInvite({ visible, onStart, onDismiss }: WorkflowTourInviteProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative z-[45] mb-5 flex justify-center px-2"
    >
      <div className="surface-card flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-primary/35 px-4 py-3 shadow-lg">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Guided workflow tour</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              An agent will walk the workspace: it highlights each area as it “works” through intake → assignment → approval →
              executive, then advances to the next view.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Play className="h-3.5 w-3.5" />
            Start tour
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
