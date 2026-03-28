# Quorum

**AI-native casework engine that sees, hears, and understands cases.**

Quorum transforms messy inputs — text, voice, images — into clear decisions and actions, instantly. Not a dashboard. A decision system.

[Live Demo](https://quorum-demo.vercel.app/)

---

## Team

| Name | Role | Focus |
|------|------|-------|
| **Matthew Jiang** | Backend & AI Integration | Node.js, MongoDB, Gemini orchestration, API design |
| **Joy Wang** | Frontend & Product | React, UX, pitch, product strategy |

Both studying at NYU.

---

## Why we built this

Government offices and legal teams are drowning in cases. Congress receives 80M messages per year. Staff spend most of their time on admin instead of helping people. Legacy tools are decades old — creating delays, errors, and low public trust.

**The gap we identified:** AI can analyze, but no system actually executes decisions. So we built one.

---

## Key features

- **Multimodal intake** — text, voice, and image input processed through a single AI pipeline
- **AI case parsing** — auto-tag, summarize, and extract key information from any format
- **Smart scoring** — urgency, risk, impact, and complexity scored on a 10-point scale
- **Agentic assignment** — AI recommends the best employee with written reasoning based on expertise, caseload, and history
- **1-click workflows** — assign, approve, escalate, or review with a single action
- **Role-based views** — caseworker, manager, approver, and executive each see exactly what they need
- **Explainable decisions** — every AI recommendation includes reasoning, not just a score

---

## Architecture

### Frontend
React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts

### Backend
Node.js (Express), MongoDB Atlas, Mongoose, 35+ REST endpoints across 8 route groups

### AI layer
Google Gemini 2.5 Flash (multimodal + structured output), 3-agent parallel orchestration pipeline, Google GenAI SDK

### Infrastructure
Google Cloud Run, GitHub

---

## How it works

1. **Submit** — a case arrives via text, voice, image, or document
2. **Parse** — Gemini analyzes the input and extracts the problem, topics, sentiment, and urgency
3. **Score** — severity agent rates urgency, impact, and complexity on a 10-point scale
4. **Assign** — employee matcher recommends the best team member with written reasoning
5. **Execute** — staff review and act with 1-click workflows
6. **Track** — the system monitors deadlines, SLAs, and satisfaction

All three AI agents run in parallel. One API call triggers the full pipeline.

---

## Target users

- Government agencies (congressional offices, state/local government)
- Legal teams (casework, compliance, constituent services)
- Enterprise operations and compliance teams

---

## Market opportunity

| Segment | Size |
|---------|------|
| TAM — U.S. Federal IT budget | $75B |
| SAM — Admin software (federal, state, local, NGOs) | $3.2B |
| SOM — Congressional offices + state + local | $98M |

Legal tech alone is a $30B+ market. Workflow automation is the fastest-growing segment.

---

## Business model

- SaaS subscriptions (per seat + per case volume)
- Government contracts
- Enterprise subscriptions with tiered AI usage

---

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, MongoDB Atlas, Mongoose |
| AI | Google Gemini 2.5 Flash, GenAI SDK, 3-agent orchestration |
| Infrastructure | Google Cloud Run, GitHub |

---

## What we learned

- AI should take action, not just provide insights
- Simplicity beats complexity — one API call, three agents, full orchestration
- Real workflows matter more than models
- Transparency builds trust — every decision needs an explanation

---

## Vision

> Every organization runs on decisions. Today, those decisions are fragmented across people, tools, and time. Quorum brings them together — and executes them.

We're not building better dashboards. We're replacing them.

---

## Acknowledgments

- NYC Open Data Week / Google Gemini AI Hackathon
- Google Gemini API and GenAI SDK
