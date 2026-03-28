import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import type { SimulationLinkDatum } from "d3-force";
import { mockCases, classificationBuckets, type Taxonomy } from "@/lib/mockData";
import { Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { toast } from "sonner";

const CX = 250;
const CY = 250;
const HUB_R = 28;
const PRIMARY_R = 22;
const R1 = 118;
const R2 = 76;
const CLUSTER_DEG = [-135, -45, 45, 135];

const BG_DEEP = "hsl(158 22% 13%)";
const BG_MID = "hsl(152 16% 17%)";
const STROKE = "hsl(152 12% 38% / 0.55)";

type Bucket = (typeof classificationBuckets)[number];

interface GraphChild {
  id: string;
  topic: Taxonomy;
  count: number;
  cx: number;
  cy: number;
  r: number;
}

interface GraphCluster {
  bucket: Bucket;
  theta: number;
  px: number;
  py: number;
  primaryId: string;
  children: GraphChild[];
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function childRadius(count: number, max: number) {
  const t = max < 1 ? 0 : count / max;
  return Math.round(11 + t * 15);
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function textFillForChild(hex: string) {
  if (hex === "#fcd34d" || hex === "#93c5fd" || hex === "#fca5a5" || hex === "#5eead4") return "#0f172a";
  return "#f8fafc";
}

function childOffset(idx: number, n: number) {
  if (n <= 1) return 0;
  const spread = 0.55;
  return -spread / 2 + (spread * idx) / (n - 1);
}

interface SimNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  r: number;
  tx: number;
  ty: number;
  role: "hub" | "primary" | "leaf";
  bucket?: Bucket;
  primaryId?: string;
  child?: GraphChild;
}

export default function CaseClassificationVisual() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simTick, setSimTick] = useState(0);
  const nodesRef = useRef<SimNode[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const heatRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [view, setView] = useState({ k: 1, px: 0, py: 0 });
  const panRef = useRef({ active: false, sx: 0, sy: 0, startPx: 0, startPy: 0 });

  const graph = useMemo((): GraphCluster[] => {
    const counts = new Map<Taxonomy, number>();
    mockCases.forEach((c) => counts.set(c.topic, (counts.get(c.topic) || 0) + 1));

    let maxC = 1;
    classificationBuckets.forEach((b) =>
      b.topics.forEach((t) => {
        maxC = Math.max(maxC, counts.get(t) ?? 0);
      })
    );
    if (maxC < 1) maxC = 1;

    return classificationBuckets.map((bucket, i) => {
      const children = bucket.topics.map((topic) => ({
        id: `${bucket.id}-${topic}`,
        topic,
        count: counts.get(topic) ?? 0,
      }));
      const theta = degToRad(CLUSTER_DEG[i] ?? -135 + i * 90);
      const px = CX + R1 * Math.cos(theta);
      const py = CY + R1 * Math.sin(theta);
      const placed: GraphChild[] = children.map((ch, idx) => {
        const off = childOffset(idx, children.length);
        const ang = theta + off;
        const cx = px + R2 * Math.cos(ang);
        const cy = py + R2 * Math.sin(ang);
        const r = Math.max(10, childRadius(ch.count, maxC));
        return { ...ch, cx, cy, r };
      });
      return { bucket, theta, px, py, primaryId: bucket.id, children: placed };
    });
  }, []);

  useEffect(() => {
    const hub: SimNode = {
      id: "hub",
      r: HUB_R,
      tx: CX,
      ty: CY,
      role: "hub",
      x: CX,
      y: CY,
      fx: CX,
      fy: CY,
    };

    const primaries: SimNode[] = graph.map((g) => ({
      id: g.primaryId,
      r: PRIMARY_R,
      tx: g.px,
      ty: g.py,
      role: "primary",
      bucket: g.bucket,
      primaryId: g.primaryId,
      x: g.px + (Math.random() - 0.5) * 10,
      y: g.py + (Math.random() - 0.5) * 10,
    }));

    const leaves: SimNode[] = graph.flatMap((g) =>
      g.children.map((ch) => ({
        id: ch.id,
        r: ch.r,
        tx: ch.cx,
        ty: ch.cy,
        role: "leaf",
        bucket: g.bucket,
        child: ch,
        x: ch.cx + (Math.random() - 0.5) * 10,
        y: ch.cy + (Math.random() - 0.5) * 10,
      }))
    );

    const nodes: SimNode[] = [hub, ...primaries, ...leaves];
    nodesRef.current = nodes;
    setSimTick((t) => t + 1);

    const links: SimulationLinkDatum<SimNode>[] = [];
    graph.forEach((g) => {
      const p = primaries.find((n) => n.id === g.primaryId)!;
      links.push({ source: hub, target: p });
      g.children.forEach((ch) => {
        const leaf = leaves.find((n) => n.id === ch.id)!;
        links.push({ source: p, target: leaf });
      });
    });

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode>(links)
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as SimNode | number;
            const t = d.target as SimNode | number;
            const a = typeof s === "object" && s !== null ? s : nodes[s as number];
            const b = typeof t === "object" && t !== null ? t : nodes[t as number];
            if (!a || !b) return 100;
            if (a.role === "hub" || b.role === "hub") return 112;
            return 72;
          })
          .strength(0.42)
      )
      .force("charge", forceManyBody<SimNode>().strength(-28))
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => d.r + 5)
          .strength(0.9)
      )
      .force("x", forceX<SimNode>((d) => d.tx).strength(0.22))
      .force("y", forceY<SimNode>((d) => d.ty).strength(0.22))
      .alphaDecay(0.018)
      .alphaMin(0.035)
      .on("tick", () => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setSimTick((t) => (t + 1) % 100000);
        });
      });

    simRef.current = sim;

    heatRef.current = window.setInterval(() => {
      sim.alpha(0.22);
      sim.restart();
    }, 4200);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearInterval(heatRef.current);
      sim.stop();
      simRef.current = null;
    };
  }, [graph]);

  const nodeById = useMemo(
    () => new Map(nodesRef.current.map((n) => [n.id, n])),
    [simTick]
  );

  const onSelect = useCallback((id: string, label: string, detail: string) => {
    setSelectedId(id);
    toast.message(label, { description: detail });
  }, []);

  const applyZoom = useCallback((delta: number) => {
    setView((v) => ({
      ...v,
      k: Math.min(2.6, Math.max(0.35, v.k * delta)),
    }));
  }, []);

  const resetView = useCallback(() => {
    setView({ k: 1, px: 0, py: 0 });
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.94 : 1.06;
      applyZoom(factor);
    },
    [applyZoom]
  );

  const onPointerDownBg = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-cc-node]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      startPx: view.px,
      startPy: view.py,
    };
  }, [view.px, view.py]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = panRef.current;
      if (!p.active) return;
      const dx = e.clientX - p.sx;
      const dy = e.clientY - p.sy;
      setView((v) => ({
        ...v,
        px: p.startPx + dx,
        py: p.startPy + dy,
      }));
    },
    []
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    panRef.current.active = false;
  }, []);

  const worldTransform = `translate(${view.px},${view.py}) translate(${CX},${CY}) scale(${view.k}) translate(${-CX},${-CY})`;

  return (
    <motion.div
      data-workflow-tour="case-classification"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-2xl border border-border shadow-[0_24px_80px_-24px_hsl(160_35%_6%/0.35)]"
      style={{
        background: `linear-gradient(165deg, ${BG_DEEP} 0%, ${BG_MID} 48%, hsl(165 14% 20%) 100%)`,
      }}
    >
      <div
        className="border-b px-5 py-4"
        style={{ borderColor: "hsl(152 12% 28% / 0.5)", background: "hsl(158 20% 11% / 0.85)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-teal-200/90"
              style={{ background: "hsl(152 18% 22% / 0.9)" }}
            >
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[hsl(72_25%_92%)]">Case classification</h3>
              <p className="text-xs text-[hsl(152_12%_62%)]">
                Physics layout — scroll to zoom, drag empty space to pan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyZoom(1.12)}
              className="rounded-lg border p-1.5 text-[hsl(72_20%_88%)] transition hover:bg-white/10"
              style={{ borderColor: "hsl(152 12% 35%)" }}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => applyZoom(0.88)}
              className="rounded-lg border p-1.5 text-[hsl(72_20%_88%)] transition hover:bg-white/10"
              style={{ borderColor: "hsl(152 12% 35%)" }}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-lg border p-1.5 text-[hsl(72_20%_88%)] transition hover:bg-white/10"
              style={{ borderColor: "hsl(152 12% 35%)" }}
              aria-label="Reset zoom and pan"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative px-1 py-3 sm:px-3"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, hsl(152 14% 19% / 0.95) 0%, hsl(158 22% 12%) 70%)",
          touchAction: "none",
        }}
      >
        <div
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDownBg}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <svg
            viewBox="0 0 500 500"
            className="mx-auto h-auto w-full max-w-[min(520px,100%)] select-none"
            role="img"
            aria-label="Case category hierarchy"
            onWheel={onWheel}
          >
            <defs>
              <filter id="ccGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={worldTransform}>
              <rect
                width={500}
                height={500}
                fill="transparent"
                pointerEvents="all"
                style={{ cursor: "grab" }}
              />
              {graph.flatMap((g) => {
                const p = nodeById.get(g.primaryId);
                const hub = nodeById.get("hub");
                if (!p || !hub || p.x == null || p.y == null || hub.x == null || hub.y == null) return [];
                return [
                  <line
                    key={`hub-${g.primaryId}`}
                    x1={hub.x}
                    y1={hub.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={STROKE}
                    strokeWidth={1.25 / view.k}
                  />,
                ];
              })}

              {graph.flatMap((g) =>
                g.children.map((ch) => {
                  const p = nodeById.get(g.primaryId);
                  const leaf = nodeById.get(ch.id);
                  if (!p || !leaf || p.x == null || p.y == null || leaf.x == null || leaf.y == null) return [];
                  return (
                    <line
                      key={`e-${ch.id}`}
                      x1={p.x}
                      y1={p.y}
                      x2={leaf.x}
                      y2={leaf.y}
                      stroke={STROKE}
                      strokeWidth={1 / view.k}
                    />
                  );
                })
              )}

              {nodeById.has("hub") && nodeById.get("hub")?.x != null && (
                <g data-cc-node>
                  <circle
                    cx={nodeById.get("hub")!.x}
                    cy={nodeById.get("hub")!.y}
                    r={HUB_R}
                    fill="hsl(210 28% 14%)"
                    stroke="hsl(152 10% 32%)"
                    strokeWidth={1.5}
                    filter="url(#ccGlow)"
                    className="cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onSelect("hub", "Classification root", `${mockCases.length} cases in dataset`)}
                  />
                  <text
                    x={nodeById.get("hub")!.x}
                    y={(nodeById.get("hub")!.y ?? 0) - 4}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="system-ui, sans-serif"
                    pointerEvents="none"
                  >
                    Quorum
                  </text>
                  <text
                    x={nodeById.get("hub")!.x}
                    y={(nodeById.get("hub")!.y ?? 0) + 9}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={9}
                    fontWeight={500}
                    fontFamily="system-ui, sans-serif"
                    pointerEvents="none"
                  >
                    classifier
                  </text>
                </g>
              )}

              {graph.map((g) => {
                const p = nodeById.get(g.primaryId);
                if (!p || p.x == null || p.y == null) return null;
                const primarySel = selectedId === g.primaryId;
                return (
                  <g key={g.primaryId} data-cc-node>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={PRIMARY_R}
                      fill={g.bucket.primaryHex}
                      stroke={primarySel ? "#f8fafc" : "rgba(255,255,255,0.18)"}
                      strokeWidth={primarySel ? 2.5 : 1.2}
                      className="cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() =>
                        onSelect(
                          g.primaryId,
                          g.bucket.label,
                          `${g.children.reduce((s, c) => s + c.count, 0)} cases in this cluster`
                        )
                      }
                    />
                    <text
                      x={p.x}
                      y={p.y - 4}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={9}
                      fontWeight={700}
                      fontFamily="system-ui, sans-serif"
                      pointerEvents="none"
                    >
                      {truncate(g.bucket.label, 16)}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + 8}
                      textAnchor="middle"
                      fill="rgba(248,250,252,0.85)"
                      fontSize={7.5}
                      fontWeight={500}
                      fontFamily="system-ui, sans-serif"
                      pointerEvents="none"
                    >
                      cluster
                    </text>

                    {g.children.map((ch) => {
                      const leaf = nodeById.get(ch.id);
                      if (!leaf || leaf.x == null || leaf.y == null) return null;
                      const sel = selectedId === ch.id;
                      const fill = g.bucket.childHex;
                      return (
                        <g key={ch.id} data-cc-node>
                          <circle
                            cx={leaf.x}
                            cy={leaf.y}
                            r={ch.r}
                            fill={fill}
                            stroke={sel ? "#f8fafc" : "rgba(15,23,42,0.35)"}
                            strokeWidth={sel ? 2.2 : 1}
                            className="cursor-pointer"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() =>
                              onSelect(
                                ch.id,
                                ch.topic,
                                `${ch.count} case${ch.count === 1 ? "" : "s"} tagged ${ch.topic}`
                              )
                            }
                          />
                          <text
                            x={leaf.x}
                            y={leaf.y - 3}
                            textAnchor="middle"
                            fill={textFillForChild(fill)}
                            fontSize={ch.r > 18 ? 9 : 8}
                            fontWeight={700}
                            fontFamily="system-ui, sans-serif"
                            pointerEvents="none"
                          >
                            {truncate(ch.topic, 12)}
                          </text>
                          <text
                            x={leaf.x}
                            y={leaf.y + (ch.r > 18 ? 9 : 7)}
                            textAnchor="middle"
                            fill={textFillForChild(fill)}
                            fontSize={7}
                            fontWeight={600}
                            opacity={0.9}
                            fontFamily="system-ui, sans-serif"
                            pointerEvents="none"
                          >
                            n={ch.count}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <AnimatePresence>
          {selectedId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-center text-[10px]"
              style={{ color: "hsl(152 12% 55%)" }}
            >
              Selected: <span style={{ color: "hsl(72 25% 88%)" }}>{selectedId}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
