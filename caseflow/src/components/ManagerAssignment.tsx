import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Sparkles, Check, ArrowRight, Brain } from "lucide-react";
import { mockCases, taxonomyColors } from "@/lib/mockData";

interface AssignmentSlot {
  caseId: string;
  recommended: string[];
  assigned: string[];
  aiReason: string;
}

const caseworkers = [
  { name: "Sarah Chen", specialty: "Housing, Compliance", load: 4, avatar: "SC" },
  { name: "Marcus Webb", specialty: "Environmental, Permits", load: 2, avatar: "MW" },
  { name: "Priya Patel", specialty: "Benefits, Civil Rights", load: 3, avatar: "PP" },
  { name: "James Torres", specialty: "Infrastructure", load: 1, avatar: "JT" },
];

const assignments: AssignmentSlot[] = mockCases.filter(c => c.status === "pending" || c.status === "in-progress").map(c => ({
  caseId: c.id,
  recommended: [c.recommendedAssignee],
  assigned: c.assignee ? [c.assignee] : [],
  aiReason: c.assigneeReason,
}));

export default function ManagerAssignment() {
  const [selectedCase, setSelectedCase] = useState<string | null>(assignments[0]?.caseId || null);
  const [assignedMap, setAssignedMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach(a => { map[a.caseId] = [...a.assigned]; });
    return map;
  });

  const toggleAssign = (caseId: string, worker: string) => {
    setAssignedMap(prev => {
      const current = prev[caseId] || [];
      return {
        ...prev,
        [caseId]: current.includes(worker)
          ? current.filter(w => w !== worker)
          : [...current, worker],
      };
    });
  };

  const selectedAssignment = assignments.find(a => a.caseId === selectedCase);
  const selectedCaseData = mockCases.find(c => c.id === selectedCase);

  return (
    <motion.div
      data-workflow-tour="manager-assignment"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">AI Assignment Engine</h2>
        </div>
        <p className="text-xs text-muted-foreground">AI recommends optimal caseworker teams per case based on expertise, load & history</p>
      </div>

      <div className="px-5 pb-5">
        {/* Case selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {assignments.map((a) => {
            const c = mockCases.find(mc => mc.id === a.caseId)!;
            const colors = taxonomyColors[c.topic];
            return (
              <button
                key={a.caseId}
                onClick={() => setSelectedCase(a.caseId)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedCase === a.caseId
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : `${colors.bg} ${colors.text} ${colors.border}`
                }`}
              >
                {a.caseId}
              </button>
            );
          })}
        </div>

        {selectedCaseData && selectedAssignment && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCase}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
            >
              {/* Case info */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border mb-4">
                <p className="text-xs font-medium text-foreground mb-0.5">{selectedCaseData.title}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCaseData.problem.slice(0, 100)}…</p>
              </div>

              {/* AI recommendation */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 mb-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain size={12} className="text-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">AI Recommendation</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{selectedAssignment.aiReason}</p>
              </div>

              {/* Team assignment grid */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assign Team Members</p>
              <div className="grid grid-cols-2 gap-2">
                {caseworkers.map((worker) => {
                  const isAssigned = (assignedMap[selectedCase!] || []).includes(worker.name);
                  const isRecommended = selectedAssignment.recommended.includes(worker.name);

                  return (
                    <motion.button
                      key={worker.name}
                      onClick={() => toggleAssign(selectedCase!, worker.name)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                        isAssigned
                          ? "bg-primary/8 border-primary/25 shadow-sm"
                          : "bg-secondary/40 border-transparent hover:border-sage-200"
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles size={8} className="text-primary-foreground" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isAssigned ? "bg-primary text-primary-foreground" : "bg-sage-200 text-sage-600"
                      }`}>
                        {isAssigned ? <Check size={14} /> : worker.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{worker.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{worker.specialty}</p>
                        <p className="text-[10px] text-muted-foreground">{worker.load} active cases</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Assigned summary */}
              {(assignedMap[selectedCase!] || []).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/15"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={14} className="text-primary" />
                    <span className="text-xs text-foreground font-medium">
                      {(assignedMap[selectedCase!] || []).length} assigned
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(assignedMap[selectedCase!] || []).join(", ")}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                    Confirm <ArrowRight size={10} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
