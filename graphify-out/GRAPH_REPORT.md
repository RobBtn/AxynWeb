# Graph Report - WEBCREA  (2026-11-12)

## Corpus Check
- 77 files · ~37,987 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .example 1, .ico 1)

## Summary
- 425 nodes · 1475 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `448948d5`
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
- mcp-tools.ts
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `requireUser()` - 47 edges
2. `get()` - 44 edges
3. `next` - 42 edges
4. `run()` - 41 edges
5. `PageTitle()` - 33 edges
6. `DataError` - 33 edges
7. `audit()` - 32 edges
8. `Card()` - 25 edges
9. `frDate()` - 23 edges
10. `getTemplate()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `LoginForm()` --indirect_call--> `login()`  [INFERRED]
  src/app/(public)/connexion/LoginForm.tsx → src/app/actions/public.ts
- `SiteWizard()` --indirect_call--> `createSiteAction()`  [INFERRED]
  src/components/SiteWizard.tsx → src/app/actions/admin.ts
- `AiCreate()` --indirect_call--> `createSiteWithAiAction()`  [INFERRED]
  src/components/AiCreate.tsx → src/app/actions/admin.ts
- `generateMetadata()` --calls--> `getTemplate()`  [EXTRACTED]
  src/app/modeles/[id]/page.tsx → src/lib/templates.ts
- `text()` --calls--> `DataError`  [EXTRACTED]
  src/lib/mcp-tools.ts → src/lib/data.ts

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.10
Nodes (67): addDomainAction(), adminAction(), applyRequestWithAiAction(), assignSiteAction(), createClientAction(), createSiteAction(), createSiteFromLeadAction(), createSiteWithAiAction() (+59 more)

### Community 1 - "next"
Cohesion: 0.06
Nodes (52): @anthropic-ai/sdk, react, three, clientIp(), FormState, submitLead(), NewSite(), LoginForm() (+44 more)

### Community 2 - "requireUser"
Cohesion: 0.19
Nodes (38): AdminClients(), AdminRequest(), AdminRequests(), AdminDomains(), AdminMcp(), AdminHome(), AdminLeads(), AdminSite() (+30 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (40): eslintConfig, dependencies, @anthropic-ai/sdk, gsap, lenis, next, react, react-dom (+32 more)

### Community 4 - "config.ts"
Cohesion: 0.05
Nodes (38): nextConfig, securityHeaders, gsap, lenis, next, AdminLayout(), metadata, ClientLayout() (+30 more)

### Community 5 - "TemplateSite.tsx"
Cohesion: 0.23
Nodes (20): generateMetadata(), Props, TemplateDemo(), Photo(), Scene3D(), Atelier(), Aurore(), Background() (+12 more)

### Community 6 - "db.ts"
Cohesion: 0.08
Nodes (35): server-only, leadSchema, loginSchema, logout(), GET(), GET(), GET(), RAW_CSP (+27 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "Webcrea — plateforme du studio"
Cohesion: 0.25
Nodes (7): Avant la mise en ligne, AxynWeb — plateforme du studio, Brancher Claude, Conformité européenne, Démarrer, Organisation du code, Sécurité

### Community 9 - "mcp-tools.ts"
Cohesion: 0.12
Nodes (16): authenticate(), DELETE, handle(), POST(), rpcError(), RpcRequest, rpcResult(), SUPPORTED (+8 more)

## Knowledge Gaps
- **8 isolated node(s):** `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react`, `@types/react-dom` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 135 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `config.ts` to `data.ts`, `next`, `requireUser`, `package.json`, `TemplateSite.tsx`, `db.ts`?**
  _High betweenness centrality (0.281) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/turbopack`, `@types/node` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10485133020344288 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.056189640035118525 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05257936507936508 - nodes in this community are weakly interconnected._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08418367346938775 - nodes in this community are weakly interconnected._