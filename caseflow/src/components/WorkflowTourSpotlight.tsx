import { useLayoutEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Bot } from "lucide-react";
import type { WorkflowTourStep } from "@/lib/workflowTour";

interface WorkflowTourSpotlightProps {
  active: boolean;
  step: WorkflowTourStep | null;
  stepIndex: number;
  totalSteps: number;
  appRole: string;
  onNext: () => void;
  onSkip: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

export default function WorkflowTourSpotlight({
  active,
  step,
  stepIndex,
  totalSteps,
  appRole,
  onNext,
  onSkip,
}: WorkflowTourSpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  const updateRect = useCallback(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-workflow-tour="${step.target}"]`);
    if (!el || !(el instanceof HTMLElement)) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [step]);

  useLayoutEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }
    updateRect();
    const t = window.setTimeout(updateRect, 120);
    const t2 = window.setTimeout(updateRect, 500);
    const el = document.querySelector(`[data-workflow-tour="${step.target}"]`);
    const observed = el instanceof HTMLElement ? el : null;
    const ro = observed ? new ResizeObserver(() => updateRect()) : null;
    if (observed && ro) ro.observe(observed);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [active, step, appRole, updateRect]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {active && step && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95]"
          aria-live="polite"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[hsl(160_35%_8%/0.52)] backdrop-blur-[1px]"
            aria-label="Dismiss tour"
            onClick={onSkip}
          />

          {rect && rect.width > 0 && (
            <motion.div
              initial={false}
              animate={{
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
              }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="pointer-events-none fixed z-[96] rounded-xl border-[3px] border-primary bg-transparent shadow-[0_0_0_6px_hsl(var(--primary)/0.15),0_12px_40px_-8px_hsl(var(--primary)/0.35)]"
            />
          )}

          <div className="fixed bottom-6 left-1/2 z-[97] w-[min(92vw,26rem)] -translate-x-1/2 px-2">
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="surface-card rounded-xl border-2 border-primary/45 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{step.agent}</p>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSkip}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="End tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSkip}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    End tour
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
                  >
                    {stepIndex >= totalSteps - 1 ? "Finish" : "Next"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
