import { useState, useEffect } from "react";
import { Role, RoleTask, roleTasks } from "@/lib/mockData";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Link2 } from "lucide-react";

interface TaskListProps {
  role: Role;
}

const roleDescriptions: Record<Role, string> = {
  caseworker: "Field visits, evidence, and constituent follow-up",
  manager: "Load balancing, escalations, and AI assignment QA",
  approver: "Legislative drafts, dual review, and exposure memos",
  exec: "Board briefings, budgets, and policy council prep",
};

export default function TaskList({ role }: TaskListProps) {
  const [tasks, setTasks] = useState<RoleTask[]>(roleTasks[role]);

  useEffect(() => {
    setTasks(roleTasks[role]);
  }, [role]);

  const toggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  return (
    <motion.div
      data-workflow-tour="task-sidebar"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Your tasks</h3>
          <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
        </div>
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {pending.length} pending
        </span>
      </div>

      <div className="space-y-1.5">
        {pending.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group"
            onClick={() => toggle(task.id)}
          >
            <Circle size={16} className="text-sage-400 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{task.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.caseId && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Link2 size={10} />
                    {task.caseId}
                  </span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {completed.length > 0 && (
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground mb-1.5">{completed.length} completed</p>
            {completed.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 p-2 rounded-lg opacity-50 cursor-pointer"
                onClick={() => toggle(task.id)}
              >
                <CheckCircle2 size={16} className="text-primary shrink-0" />
                <p className="text-sm text-foreground line-through">{task.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
