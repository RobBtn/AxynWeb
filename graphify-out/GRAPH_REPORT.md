# Graph Report - WEBCREA  (2026-11-12)

## Corpus Check
- 74 files · ~37,016 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .example 1, .ico 1)

## Summary
- 416 nodes · 1454 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e797b1ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- next
- requireUser
- package.json
- config.ts
- TemplateSite.tsx
- db.ts
- compilerOptions
- Webcrea — plateforme du studio
- connexion/page.tsx
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `requireUser()` - 47 edges
2. `get()` - 44 edges
3. `run()` - 41 edges
4. `next` - 39 edges
5. `PageTitle()` - 33 edges
6. `DataError` - 33 edges
7. `audit()` - 32 edges
8. `Card()` - 25 edges
9. `frDate()` - 23 edges
10. `all()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `LoginForm()` --indirect_call--> `login()`  [INFERRED]
  src/app/(public)/connexion/LoginForm.tsx → src/app/actions/public.ts
- `SiteWizard()` --indirect_call--> `createSiteAction()`  [INFERRED]
  src/components/SiteWizard.tsx → src/app/actions/admin.ts
- `AiCreate()` --indirect_call--> `createSiteWithAiAction()`  [INFERRED]
  src/components/AiCreate.tsx → src/app/actions/admin.ts
- `Estimator()` --indirect_call--> `submitLead()`  [INFERRED]
  src/components/Estimator.tsx → src/app/actions/public.ts
- `generateMetadata()` --calls--> `getTemplate()`  [EXTRACTED]
  src/app/modeles/[id]/page.tsx → src/lib/templates.ts

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.10
Nodes (60): addDomainAction(), adminAction(), applyRequestWithAiAction(), assignSiteAction(), createClientAction(), createSiteAction(), createSiteFromLeadAction(), createSiteWithAiAction() (+52 more)

### Community 1 - "next"
Cohesion: 0.09
Nodes (31): @anthropic-ai/sdk, react, zod, FormState, NewSite(), metadata, ModelesPage(), AiCreate() (+23 more)

### Community 2 - "requireUser"
Cohesion: 0.15
Nodes (45): AdminClients(), AdminRequest(), AdminRequests(), AdminDomains(), AdminLayout(), metadata, AdminMcp(), AdminHome() (+37 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (39): eslintConfig, dependencies, @anthropic-ai/sdk, gsap, lenis, next, react, react-dom (+31 more)

### Community 4 - "config.ts"
Cohesion: 0.06
Nodes (38): nextConfig, securityHeaders, gsap, lenis, next, display, geistMono, geistSans (+30 more)

### Community 5 - "TemplateSite.tsx"
Cohesion: 0.23
Nodes (19): generateMetadata(), Props, TemplateDemo(), Photo(), Scene3D(), Atelier(), Aurore(), Background() (+11 more)

### Community 6 - "db.ts"
Cohesion: 0.07
Nodes (61): server-only, changePassword(), createRequest(), guard(), ownedSite(), replyRequest(), saveContent(), setPhoto() (+53 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "Webcrea — plateforme du studio"
Cohesion: 0.25
Nodes (7): Avant la mise en ligne, AxynWeb — plateforme du studio, Brancher Claude, Conformité européenne, Démarrer, Organisation du code, Sécurité

### Community 9 - "connexion/page.tsx"
Cohesion: 0.29
Nodes (9): three, LoginForm(), ConnexionPage(), metadata, buildShapes(), hex(), ParticleStage(), rng() (+1 more)

## Knowledge Gaps
- **8 isolated node(s):** `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react`, `@types/react-dom` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 132 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `config.ts` to `data.ts`, `next`, `requireUser`, `package.json`, `TemplateSite.tsx`, `db.ts`, `connexion/page.tsx`?**
  _High betweenness centrality (0.266) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/turbopack`, `@types/node` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09633649932157395 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._
- **Should `requireUser` be split into smaller, more focused modules?**
  _Cohesion score 0.14918414918414918 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060496067755595885 - nodes in this community are weakly interconnected._