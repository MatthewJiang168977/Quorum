import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Scale,
  Landmark,
  BookOpen,
  Shield,
  Gavel,
  Sparkles,
  Mail,
  Video,
  MessageSquare,
} from "lucide-react";
import { execAiDraftPresets, execLegalCompliance } from "@/lib/mockData";

function SlackGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834V5.042zm0 1.273a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.836a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.274 0a2.527 2.527 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.161 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.161 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.161 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zm0-1.274a2.527 2.527 0 0 1-2.521-2.521 2.527 2.527 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.161a2.528 2.528 0 0 1-2.522 2.521h-6.313z" />
    </svg>
  );
}

export default function ExecutiveComplianceSection() {
  const L = execLegalCompliance;

  const ping = (name: string, detail: string) => {
    toast.message(`Connect: ${name}`, { description: detail });
  };

  const draft = (label: string) => {
    toast.success("Draft queued", {
      description: `AI will generate “${label}” with executive tone and case cross-references (demo).`,
    });
  };

  return (
    <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="surface-card rounded-2xl border border-border/80 p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Legal & professional standards</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Anchor portfolio work to governing law, procedure, and ethics — aligned to active high-impact matters so oversight stays
              defensible.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed">
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Landmark className="h-3.5 w-3.5 text-primary" />
              Relevant law (illustrative)
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground/90">State / local:</span>{" "}
                {L.laws.state.map((s, i) => (
                  <span key={i}>
                    {i > 0 ? " · " : ""}
                    {s}
                  </span>
                ))}
              </li>
              <li>
                <span className="font-medium text-foreground/90">Federal:</span>{" "}
                {L.laws.federal.map((s, i) => (
                  <span key={i}>
                    {i > 0 ? " · " : ""}
                    {s}
                  </span>
                ))}
              </li>
              <li>
                <span className="font-medium text-foreground/90">Administrative:</span>{" "}
                {L.laws.administrative.map((s, i) => (
                  <span key={i}>
                    {i > 0 ? " · " : ""}
                    {s}
                  </span>
                ))}
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Gavel className="h-3.5 w-3.5 text-primary" />
              Court & administrative procedure
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
              {L.procedures.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Ethical obligations
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
              {L.ethics.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Key cases (standards alignment)
            </p>
            <ul className="space-y-2">
              {L.keyCases.map((k) => (
                <li key={k.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[11px] font-semibold text-primary">{k.id}</span>
                  <span className="text-foreground/95">{k.label}</span>
                  <span className="text-muted-foreground">— {k.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card rounded-2xl border border-border/80 p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">AI drafts & channel integrations</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              One-tap drafts for executive comms; quick pings to Slack, Gmail, and Google Meet (connectors are demo UI).
            </p>
          </div>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Auto-draft</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {execAiDraftPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => draft(preset.label)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="font-semibold text-foreground">{preset.label}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{preset.hint}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Quick ping</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => ping("Slack", "#exec-legal — ping sent (demo)")}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-[#4A154B]/12 px-3 py-3 text-xs font-semibold text-[#4A154B] transition hover:bg-[#4A154B]/18"
          >
            <SlackGlyph className="h-4 w-4" />
            Slack
          </button>
          <button
            type="button"
            onClick={() => ping("Gmail", "Compose opened with executive template (demo)")}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary/5"
          >
            <Mail className="h-4 w-4 text-primary" />
            Gmail
          </button>
          <button
            type="button"
            onClick={() => ping("Google Meet", "Instant meeting link generated (demo)")}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary/5"
          >
            <Video className="h-4 w-4 text-primary" />
            Meet
          </button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>Drafts use your org tone rules; Slack, Gmail, and Meet connectors require OAuth in production.</span>
        </div>
      </motion.div>
    </section>
  );
}
