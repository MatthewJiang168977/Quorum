import { Bot, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WorkflowRunChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuided: () => void;
  onNormal: () => void;
  /** False when opened from the home dashboard (guided jumps to workspace). */
  isWorkspace?: boolean;
}

export default function WorkflowRunChoiceDialog({
  open,
  onOpenChange,
  onGuided,
  onNormal,
  isWorkspace = true,
}: WorkflowRunChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Run workflow</DialogTitle>
          <DialogDescription className="text-left text-muted-foreground">
            {isWorkspace ? (
              <>
                Choose <span className="font-medium text-foreground">guided</span> to step through each stage with on-page highlights and
                short explanations, or <span className="font-medium text-foreground">normal</span> for a fast sync that switches views with
                toasts only.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">Guided</span> opens the workspace and runs the full highlight tour.{" "}
                <span className="font-medium text-foreground">Normal</span> cycles this dashboard through each lens here only.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/30 sm:w-auto"
            onClick={() => {
              onNormal();
              onOpenChange(false);
            }}
          >
            <Zap className="h-4 w-4" />
            Normal (quick sync)
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              onGuided();
              onOpenChange(false);
            }}
          >
            <Bot className="h-4 w-4" />
            Guided (highlights)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
