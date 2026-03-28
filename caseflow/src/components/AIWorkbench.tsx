import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image, FileText, Video, Mic, MicOff, Sparkles, Brain,
  Upload, Eye, Layers, PenTool, Mail, FileSignature,
  Activity, Zap, MessageSquare, Search, Shield
} from "lucide-react";

type AIMode = "analyze" | "live" | "draft";

const modes: { id: AIMode; label: string; icon: typeof Brain; description: string }[] = [
  { id: "analyze", label: "Multimodal Analysis", icon: Eye, description: "Analyze images, documents & video evidence" },
  { id: "live", label: "Live Agent", icon: Mic, description: "Real-time voice interaction & brainstorming" },
  { id: "draft", label: "Draft & Ideate", icon: PenTool, description: "AI-generated motions, emails & documents" },
];

const evidenceItems = [
  { type: "image", label: "Site Photo — Unit 3A", confidence: 94, icon: Image, status: "Mold confirmed" },
  { type: "document", label: "Inspection Report 2025", confidence: 88, icon: FileText, status: "3 violations found" },
  { type: "video", label: "Walkthrough Video", confidence: 91, icon: Video, status: "Water damage visible" },
  { type: "document", label: "Tenant Complaint Letter", confidence: 96, icon: FileText, status: "Key claims extracted" },
  { type: "image", label: "Damage Photo — Hallway", confidence: 82, icon: Image, status: "Structural concern" },
];

const draftTemplates = [
  { label: "Motion to Compel Inspection", type: "motion", icon: FileSignature, status: "ready" },
  { label: "Client Update Email", type: "email", icon: Mail, status: "ready" },
  { label: "Settlement Demand Letter", type: "document", icon: FileText, status: "ready" },
  { label: "Compliance Notice", type: "document", icon: Shield, status: "draft" },
];

const liveTopics = [
  { label: "What precedents apply to QR-1042?", category: "Research" },
  { label: "Summarize the housing code violations", category: "Summary" },
  { label: "Draft a response strategy for the tenant association", category: "Strategy" },
  { label: "What's our exposure on ADA compliance?", category: "Risk" },
];

export default function AIWorkbench() {
  const [activeMode, setActiveMode] = useState<AIMode>("analyze");
  const [isListening, setIsListening] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [processingDraft, setProcessingDraft] = useState<number | null>(null);

  const handleDraftGenerate = (index: number) => {
    setProcessingDraft(index);
    setTimeout(() => setProcessingDraft(null), 2000);
  };

  return (
    <motion.div
      data-workflow-tour="ai-workbench"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">AI Workbench</h2>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10">
            <Activity size={12} className="text-primary" />
            <span className="text-[10px] font-medium text-primary">Active</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Multimodal intelligence for case analysis, live interaction & document drafting</p>
      </div>

      {/* Mode Switcher */}
      <div className="px-5 pb-4">
        <div className="flex gap-1.5 bg-secondary/60 rounded-xl p-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeMode === mode.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <mode.icon size={14} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 pb-5 min-h-[320px]">
        <AnimatePresence mode="wait">
          {activeMode === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Upload zone */}
              <div className="border-2 border-dashed border-sage-300 rounded-xl p-4 mb-4 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <Upload size={20} className="mx-auto text-sage-400 group-hover:text-primary/60 mb-1.5 transition-colors" />
                <p className="text-xs font-medium text-foreground">Drop evidence files here</p>
                <p className="text-[10px] text-muted-foreground">Images, PDFs, videos — AI analyzes instantly</p>
              </div>

              {/* Evidence grid */}
              <div className="space-y-2">
                {evidenceItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedEvidence(selectedEvidence === i ? null : i)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      selectedEvidence === i
                        ? "bg-primary/8 border border-primary/20 shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border border-transparent"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === "image" ? "bg-amber-50 text-amber-600"
                        : item.type === "video" ? "bg-violet-50 text-violet-600"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.status}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-10 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.confidence}%` }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-primary">{item.confidence}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Analysis summary */}
              <AnimatePresence>
                {selectedEvidence !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/15"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={12} className="text-primary" />
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">AI Analysis</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">
                      Evidence corroborates tenant claims. {evidenceItems[selectedEvidence].label} shows
                      clear indicators supporting case escalation. Cross-referencing with {evidenceItems.length - 1} other
                      evidence items reveals a consistent pattern of violations.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeMode === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Voice orb */}
              <div className="flex flex-col items-center py-6">
                <motion.button
                  onClick={() => setIsListening(!isListening)}
                  animate={isListening ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      "0 0 0 0 hsla(152, 45%, 42%, 0.3)",
                      "0 0 0 20px hsla(152, 45%, 42%, 0)",
                      "0 0 0 0 hsla(152, 45%, 42%, 0)"
                    ]
                  } : {}}
                  transition={{ repeat: isListening ? Infinity : 0, duration: 1.8 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    isListening
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-sage-200"
                  }`}
                >
                  {isListening ? <Mic size={28} /> : <MicOff size={28} />}
                </motion.button>
                <p className="text-xs font-medium text-foreground mt-3">
                  {isListening ? "Listening…" : "Tap to start"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isListening ? "Ask anything about your cases" : "Voice-powered case assistant"}
                </p>
              </div>

              {/* Waveform */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-[3px] h-8 mb-4"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                      transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.5, delay: i * 0.04 }}
                      className="w-[3px] rounded-full bg-primary/60"
                    />
                  ))}
                </motion.div>
              )}

              {/* Suggested queries */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Suggested queries</p>
                {liveTopics.map((topic, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-transparent hover:border-sage-200 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      {topic.category === "Research" ? <Search size={13} className="text-primary" /> :
                       topic.category === "Summary" ? <Layers size={13} className="text-primary" /> :
                       topic.category === "Strategy" ? <Zap size={13} className="text-primary" /> :
                       <Shield size={13} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{topic.label}</p>
                      <p className="text-[10px] text-muted-foreground">{topic.category}</p>
                    </div>
                    <MessageSquare size={12} className="text-sage-400 group-hover:text-primary transition-colors shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {activeMode === "draft" && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Generate from case context</p>

              <div className="space-y-2">
                {draftTemplates.map((template, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-transparent hover:border-sage-200 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      template.type === "motion" ? "bg-violet-50 text-violet-600"
                        : template.type === "email" ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      <template.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{template.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {template.status === "ready" ? "AI-ready • Uses case QR-1042 context" : "Template draft"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDraftGenerate(i)}
                      disabled={processingDraft === i}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 ${
                        processingDraft === i
                          ? "bg-primary/10 text-primary"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      }`}
                    >
                      {processingDraft === i ? (
                        <span className="flex items-center gap-1">
                          <Sparkles size={10} className="animate-spin" />
                          Generating…
                        </span>
                      ) : "Generate"}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Preview area */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Draft Preview</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 rounded bg-sage-200 w-full" />
                  <div className="h-2.5 rounded bg-sage-200 w-11/12" />
                  <div className="h-2.5 rounded bg-sage-200 w-4/5" />
                  <div className="h-2.5 rounded bg-sage-100 w-full mt-3" />
                  <div className="h-2.5 rounded bg-sage-100 w-10/12" />
                  <div className="h-2.5 rounded bg-sage-100 w-3/4" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                    Refine Draft
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-medium">
                    Export
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
