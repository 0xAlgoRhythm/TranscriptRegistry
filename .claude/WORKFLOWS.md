# WORKFLOWS.md — johnokyere.xyz

Execution playbooks for autonomous AI-assisted development on this repo.  
All agents live in `.claude/agents/`, commands in `.claude/commands/`, skills in `.claude/skills/`.

---

## Legend

```
[agent]   → .claude/agents/*.md      (invoke as a subagent)
/command  → .claude/commands/*.md    (slash command)
{skill}   → .claude/skills/*/SKILL.md (load as context)
```

---

## 1. Planning Workflow

Use when: starting a new feature, new page, new content type, or any change touching 3+ files.

```
TRIGGER: New task arrives
   │
   ├─ Is it a content-only change (new MDX file)?
   │    └─ YES → Skip to §3 Implementation (no planning needed)
   │
   └─ NO → Proceed with planning
```

### Steps

| # | Action | Tool |
|---|---|---|
| 1 | Load repo context | `/plan` command |
| 2 | Read `CLAUDE.md` §6 Architectural Guardrails | — |
| 3 | Read `config/site.ts` if task touches identity/links | — |
| 4 | Read `content-collections.ts` if task touches content types | — |
| 5 | Invoke planner to produce phased implementation plan | `[planner]` agent |
| 6 | Planner MUST wait for explicit confirmation before any code | — |
| 7 | If plan touches `app/layout.tsx`, `globals.css`, or `config/site.ts` — flag wide blast radius | `[planner]` |
| 8 | Confirm plan, then proceed to §3 | — |

### Skill context to load for planning
| Task type | Load skill |
|---|---|
| New page or route | `{nextjs-turbopack}` |
| New UI component or animation | `{frontend-patterns}` |
| New design token or primitive | `{design-system}` |
| New MDX component or content type | `{content-engine}` |

### Guardrails enforced at planning time
- Plans may not propose splitting `globals.css`
- Plans may not propose adding `"use client"` to layout-level components without justification
- Plans adding required fields to MDX schemas must include updates to all existing MDX files
- Plans must specify exact file paths — no vague "create a component" steps

---

## 2. Implementation Workflow

Use when: executing an approved plan or making a targeted fix.

### Setup

```bash
pnpm dev    # ALWAYS — starts content-collections watch + next dev --turbopack
```

### Steps

| # | Action | Tool |
|---|---|---|
| 1 | Activate dev context | load `contexts/dev.md` |
| 2 | Read the target file(s) before editing — understand existing patterns | — |
| 3 | Check `globals.css` for existing tokens before writing any new CSS | — |
| 4 | Implement the change following `CLAUDE.md` §6–§11 rules | — |
| 5 | Run typecheck immediately after each file edit | `pnpm typecheck` |
| 6 | If typecheck fails → invoke build error resolver immediately (don't continue) | `[build-error-resolver]` |
| 7 | Run lint after all edits complete | `pnpm lint` |
| 8 | Format | `pnpm format` |
| 9 | Visual verify (dark + light, mobile + desktop) | `pnpm dev` |
| 10 | Proceed to §3 Review | — |

### Implementation decision map

```
Adding a new home page section?
  → Create components/sections/[name].tsx
  → Decide: Server (no hooks/events) or Client ("use client")
  → Use SectionGrid + SectionTitle + SectionContent layout
  → Import and add to app/page.tsx

Adding a new /work project?
  → Create content/work/[slug].mdx
  → Required frontmatter: title, description, href, status, sort
  → Set sort = max(existing sorts) + 1
  → pnpm typecheck to validate schema

Adding a new /writing post?
  → Create content/writing/[slug].mdx
  → Required frontmatter: title, summary, date (YYYY-MM-DD)

Adding a new UI primitive?
  → Create components/ui/[name].tsx
  → Use CVA for variants if the component has states
  → Export as named export only
  → Add data-slot attribute

Adding a new MDX inline component?
  → Create in components/shells/ or components/ui/
  → Register in components map in components/mdx.tsx
  → Update CLAUDE.md §8

Adding a new Zustand store?
  → Create lib/store/use-[noun].tsx
  → Flat store only: state + setters in one create<State>() call
  → Name hook useNounStore (PascalCase noun)
```

### Anti-pattern interrupt rules
Stop and fix immediately if you catch yourself doing any of these:
- Running `next dev` without content-collections
- Importing from `lucide-react`
- Writing `dark:` class overrides for tokens that exist in the design system
- Using `text-[arbitrary-size]` instead of the defined scale
- Using relative paths (`../../`) instead of `@/` aliases
- Writing a default export from `components/` or `lib/`

---

## 3. Review Workflow

Use after: every implementation, before marking any task done.

### Automated gate (non-negotiable, run in order)

```bash
pnpm typecheck   # Step 1 — zero errors required. On failure → invoke [build-error-resolver]
pnpm lint        # Step 2 — zero errors required. On failure → fix, then re-run
pnpm build       # Step 3 — must succeed. On failure → invoke [build-error-resolver]
```

### Agent review sequence

| Step | Invoke | Scope |
|---|---|---|
| 1 | `[typescript-reviewer]` | All modified `.ts` / `.tsx` files |
| 2 | `[code-reviewer]` | Full changeset — security, quality, React/Next.js patterns |
| 3 | `[security-reviewer]` | Only if change touches: external links, env vars, MDX content pipeline |

### Visual verification checklist

Run `pnpm dev`, then manually verify:

```
□ Dark mode — colors render correctly, no hardcoded light values
□ Light mode — no dark-only assumptions (emerald dot, neutral-900 FAB backgrounds)
□ Mobile ≤640px — floating nav (home + command buttons) visible and functional
□ Desktop ≥1024px — 52rem max-width constraint respected, no horizontal overflow
□ ⌘K command menu — opens, navigates, closes correctly
□ New interactive elements — have aria-label or visible text
□ New images — use next/image, have alt text
□ No console.log output in DevTools
□ No commented-out code in modified files
```

### Blocking review findings (must fix before done)

| Finding | Severity |
|---|---|
| TypeScript errors | BLOCK |
| Build failure | BLOCK |
| `any` type without justification | BLOCK |
| Hardcoded `siteConfig` values | BLOCK |
| Missing `rel="noopener noreferrer"` on external links | BLOCK |
| Lucide icon import | BLOCK |
| `next dev` in docs/scripts | BLOCK |
| `console.log` in source | HIGH |
| Commented-out code block | HIGH |
| `dark:` override for design system token | HIGH |
| Missing `aria-label` on interactive element | HIGH |
| `any` with `// @ts-ignore` | HIGH |
| Index used as React list key | MEDIUM |
| Layout-affecting Framer Motion animation | MEDIUM |

### Command shortcut
```
/code-review    → runs [code-reviewer] against git diff
/verify         → runs full automated gate (build + typecheck + lint + console.log audit)
/verify quick   → build + typecheck only
```

---

## 4. Debugging Workflow

Use when: something is broken, a build fails, or behavior is unexpected.

### Decision tree

```
What broke?
│
├─ pnpm typecheck fails
│    └─ Invoke [build-error-resolver]
│         → Fixes type errors with minimal diffs
│         → Re-runs pnpm typecheck after each fix
│         → Does NOT refactor — only fixes errors
│
├─ pnpm build fails
│    └─ Invoke [build-error-resolver]
│         → RSC/client boundary violations show up here
│         → MDX schema errors show up here
│         → module resolution errors show up here
│
├─ pnpm dev throws an error at startup
│    ├─ "Cannot find module 'content-collections'"
│    │    └─ content-collections types not generated
│    │         Fix: pnpm content-collections build (or use pnpm dev, not next dev)
│    │
│    └─ Other module error
│         → Load {nextjs-turbopack} skill context, then diagnose
│
├─ Visual/UI bug
│    ├─ Wrong color in dark mode
│    │    → Check if component uses semantic token or hardcoded value
│    │    → Check if dark: override conflicts with CSS variable reassignment
│    │
│    ├─ Layout broken on mobile
│    │    → Check if component breaks out of 52rem constraint
│    │    → Check sm: / md: breakpoint classes
│    │
│    └─ Animation jank
│         → Check if animating layout properties (width/height/top/left)
│         → Should only animate transform and opacity
│
└─ Content not showing up
     → Check MDX frontmatter has all required fields
     → Run pnpm typecheck — schema errors surface here
     → Confirm content-collections watch is running (use pnpm dev)
```

### Quick diagnostics

```bash
# Full cache reset (Turbopack cache issue)
Remove-Item -Recurse -Force .next
pnpm dev

# Regenerate content-collections types
pnpm content-collections build

# Check all type errors at once (no incremental cache)
npx tsc --noEmit --incremental false

# Find where a token/class is used
grep -r "text-\[" components/ app/   # find arbitrary text sizes (anti-pattern)
grep -r "dark:" components/          # find dark: overrides that may conflict
grep -r "lucide" .                   # find any Lucide icon imports
```

### Escalation
If `[build-error-resolver]` cannot fix an error after 3 attempts → stop, invoke `[architect]` to assess whether the issue requires architectural changes.

---

## 5. Refactoring Workflow

Use when: cleaning dead code, removing commented blocks, consolidating duplicates, or restructuring components.

### Pre-conditions (all must be true before starting)
- [ ] Not in the middle of an active feature development
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes

### Steps

| # | Action | Tool |
|---|---|---|
| 1 | Detect dead code and categorize | `[refactor-cleaner]` agent |
| 2 | Run analysis tools | `/refactor-clean` command (runs `npx knip`, `npx depcheck`, `npx ts-prune`) |
| 3 | Categorize: SAFE / CAUTION / DANGER | `[refactor-cleaner]` |
| 4 | Delete SAFE items one at a time, verify build after each | — |
| 5 | For CAUTION items: grep for dynamic imports and string references first | — |
| 6 | Run `pnpm typecheck` + `pnpm build` after each batch | — |
| 7 | Review cleaned code | `/code-review` |

### Repo-specific refactoring targets (prioritized)

| Target | File | Action | Risk |
|---|---|---|---|
| Dead commented-out block | `components/sections/about.tsx` lines 1–111 | Delete entire commented block | SAFE |
| Stale duplicate imports | All files | Biome auto-organizes on `pnpm format` | SAFE |
| Unused CSS utilities | `app/globals.css` | Check with `npx knip` before removing | CAUTION |
| `"use client"` audit | `components/sections/` | Verify each directive is necessary | CAUTION |

### Refactoring guardrails
- Never rename `cn` — imported everywhere
- Never rename CSS variable names in `globals.css` — grep cascade before any rename
- Never change `config/site.ts` shape without updating all consumers
- Never split `globals.css`
- Refactor and feature work must never happen in the same commit

---

## 6. Testing Workflow

> This repo has no automated test suite. These workflows apply when adding tests or doing visual QA.

### Visual QA (current primary testing method)

```bash
pnpm dev    # start dev server
```

| Test | Viewport | What to check |
|---|---|---|
| Home page renders | ≤640px | Floating nav appears bottom-left, no horizontal scroll |
| Home page renders | ≥1024px | 52rem max-width, dashed vertical lines, sections stack correctly |
| Dark mode | Any | All colors from design system, no hardcoded values bleed through |
| Light mode | Any | No dark-only UI (neutral-900 backgrounds on mobile nav look different) |
| ⌘K menu | Desktop | Opens, keyboard navigates, navigates to /work and /writing, closes |
| /work listing | Any | All projects render with sort order, hover preview card works |
| /work/[slug] | Any | MDX renders, ImageCarousel/ImageShell/VideoViewer work |
| /writing listing | Any | Posts render sorted by date |
| /writing/[slug] | Any | MDX renders, reading-time shows, prev/next links present |
| Theme toggle | Any | Switches between dark/light, persists on refresh |

### When adding automated tests (future)

Preferred stack: **Playwright** for E2E.

```
Workflow:
1. Load {browser-qa} skill context
2. Use /tdd command → [tdd-guide] agent
3. Write tests for: route rendering, MDX content loading, command menu
4. Priority test targets:
   - /work renders all projects (no 404s)
   - /writing renders all posts
   - ⌘K menu opens and navigates
   - Theme toggle persists
5. Run: npx playwright test
6. Review with /code-review after writing tests
```

### Pre-build validation (always run before `pnpm build`)

```bash
pnpm typecheck    # catches MDX schema mismatches, RSC violations
pnpm lint         # catches anti-patterns, Biome rules
pnpm build        # the final gate — catches everything the above misses
```

---

## 7. Deployment Workflow

Target: Vercel. All deployments are triggered by git push to main.

### Pre-deploy checklist

```bash
# Run the full verification suite
/verify pre-pr    # runs build + typecheck + lint + security scan + console.log audit
```

Or manually:
```bash
pnpm typecheck    # must be zero errors
pnpm lint         # must be zero errors
pnpm build        # must succeed — this is what Vercel runs
```

### Deployment steps

| # | Action | Notes |
|---|---|---|
| 1 | Complete review workflow (§3) | All gates green |
| 2 | Run `pnpm build` locally | Mirrors Vercel's build exactly |
| 3 | Confirm OG image is correct | Check `config/site.ts` `ogImage` points to live URL |
| 4 | Confirm `siteConfig.url` is production URL (not localhost) | `config/site.ts` |
| 5 | Commit and push to main | Vercel auto-deploys |
| 6 | Monitor Vercel build log | Build command: `content-collections build && next build --turbopack` |
| 7 | Smoke test deployed site | Test dark mode, /work, /writing, ⌘K menu |

### Vercel configuration (inferred — verify in Vercel dashboard)

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build command | `content-collections build && next build --turbopack` |
| Output directory | `.next` |
| Install command | `pnpm install` |
| Environment variables | None currently required |
| Remote image domain | `utfs.io` (configured in `next.config.ts`) |

### Rollback
If a deployment breaks: revert the commit and push. Vercel redeploys automatically.

```bash
git revert HEAD --no-edit
git push origin main
```

### Content-only deploys
Updating only MDX files in `content/` (no code changes) still requires a full redeploy because content is compiled at build time, not at runtime.

---

## Quick Reference Card

```
New feature            → /plan → [planner] → implement → /verify → /code-review
New MDX content        → create .mdx → pnpm typecheck → pnpm build
Build broken           → [build-error-resolver] → /build-fix
Type errors            → [build-error-resolver] → pnpm typecheck
Code review            → [typescript-reviewer] → [code-reviewer]
Dead code cleanup      → [refactor-cleaner] → /refactor-clean
Visual QA              → pnpm dev → manual checklist
Deploy                 → /verify pre-pr → pnpm build → git push main
Security concern       → [security-reviewer]
Architecture question  → [architect] → [planner]
Dev server slow        → {nextjs-turbopack} skill → cache reset
New animation/3D       → {frontend-patterns} skill
New design token       → {design-system} skill
New content type       → {content-engine} skill
```


## Context Loading Priority

Before any substantial task, load context in this order:

1. `.claude/CLAUDE.md`
2. `.claude/WORKFLOWS.md`
3. Relevant `contexts/*.md`
4. Relevant `skills/*/SKILL.md`
5. Relevant target file(s)
6. Dependent/importing file(s)

Never begin implementation without understanding:
- architectural boundaries
- existing patterns
- dependent files
- design system constraints


## Autonomous Safety Limits

Agents must STOP and request confirmation before:

- deleting more than 3 files
- modifying `globals.css`
- modifying `content-collections.ts`
- modifying `config/site.ts`
- changing dependency versions
- adding new npm packages
- introducing `"use client"` to layout-level components
- renaming exported components
- changing Zustand store shapes
- changing route structure
- modifying build tooling
- modifying `next.config.ts`
- modifying `.eslintrc.json`


## Commit Protocol

One logical concern per commit.

Do not combine:
- feature work + refactors
- styling + architecture changes
- dependency updates + UI work
- schema changes + unrelated fixes

Preferred commit order:
1. infrastructure
2. architecture
3. implementation
4. cleanup
5. documentation



## Repository Risk Zones

HIGH RISK:
- app/layout.tsx
- app/globals.css
- content-collections.ts
- config/site.ts

MEDIUM RISK:
- components/ui/*
- components/mdx.tsx
- lib/store/*

LOW RISK:
- content/*
- isolated sections
- static MDX content

## Performance Budget

Avoid:
- unnecessary client components
- large animation libraries
- runtime markdown parsing
- unnecessary Zustand usage
- layout thrashing animations
- oversized image assets

Prefer:
- Server Components
- static rendering
- lazy loading
- transform/opacity animations
- tree-shakeable imports

## AI Reasoning Procedure

Before implementing:
1. Understand the existing pattern
2. Check if similar code already exists
3. Reuse existing abstractions first
4. Minimize surface area of changes
5. Predict downstream impact
6. Prefer consistency over novelty

After implementing:
1. Re-read modified files
2. Re-check imports
3. Re-check type safety
4. Re-check RSC/client boundaries
5. Re-check accessibility
6. Re-check mobile responsiveness


