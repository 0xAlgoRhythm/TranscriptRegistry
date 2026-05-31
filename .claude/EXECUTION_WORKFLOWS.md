# Optimized Execution Workflows — johnokyere.xyz

This document maps specific task types to the most effective AI agents and skills available in this repository. Use these as playbooks for autonomous execution.

---

## 1. Feature Development
*High-complexity tasks involving new pages, routes, or logic.*

| Role | Agent | Skill |
|---|---|---|
| **Architect** | `planner` | `{nextjs-turbopack}` |
| **Builder** | `typescript-reviewer` | `{frontend-patterns}` |
| **QA** | `code-reviewer` | `{browser-qa}` |

**Workflow:**
1. Invoke `planner` with the `/plan` command to generate a phased implementation plan.
2. If data is involved, update `content-collections.ts` and run `pnpm typecheck`.
3. Build components following the RSC-first boundary rules.
4. Verify with `/verify` (build + typecheck + lint).

---

## 2. Bug Fixing
*Resolving runtime errors, logical bugs, or visual regressions.*

| Role | Agent | Skill |
|---|---|---|
| **Debugger** | `build-error-resolver` | `{coding-standards}` |
| **Fixer** | `typescript-reviewer` | `{nextjs-turbopack}` |
| **Verifier** | `code-reviewer` | — |

**Workflow:**
1. Reproduce the bug (use `pnpm dev` or `pnpm build` if it's a build error).
2. Trace the error via `build-error-resolver`.
3. Apply the fix and immediately run `pnpm typecheck`.
4. Run manual visual QA for both dark and light modes.

---

## 3. Refactoring
*Cleaning dead code, consolidating components, or updating patterns.*

| Role | Agent | Skill |
|---|---|---|
| **Cleaner** | `refactor-cleaner` | `{coding-standards}` |
| **Reviewer** | `code-reviewer` | — |

**Workflow:**
1. Run `/refactor-clean` to identify targets.
2. Categorize changes into SAFE (dead code) vs. CAUTION (shared logic).
3. Execute deletions/restructuring in small, verifiable batches.
4. Run `pnpm build` after every batch to ensure no broken imports.

---

## 4. UI Implementation
*Building new UI components or sections from design specs.*

| Role | Agent | Skill |
|---|---|---|
| **Designer** | `code-reviewer` | `{design-system}` |
| **Animator** | `code-reviewer` | `{frontend-patterns}` |

**Workflow:**
1. Check `globals.css` for existing OKLCH tokens and typography classes.
2. Implement using `SectionGrid` primitives for consistency.
3. Add Framer Motion micro-animations (animate only transform/opacity).
4. QA on mobile (≤640px) and check both themes.

---

## 5. Accessibility Review
*Ensuring WCAG compliance and keyboard navigation.*

| Role | Agent | Skill |
|---|---|---|
| **Auditor** | `security-reviewer` | `{browser-qa}` |
| **Remediator** | `code-reviewer` | `{design-system}` |

**Workflow:**
1. Audit interactive elements for `aria-label` and `type="button"`.
2. Verify heading hierarchy (exactly one `<h1>` per page).
3. Test keyboard navigation flow (Tab order, Focus states).
4. Ensure decorative elements have `aria-hidden`.

---

## 6. Performance Review
*Optimizing bundle size, load times, and animation jank.*

| Role | Agent | Skill |
|---|---|---|
| **Profiler** | `architect` | `{nextjs-turbopack}` |
| **Optimizer** | `planner` | `{frontend-patterns}` |

**Workflow:**
1. Audit `next/image` usage (priority, sizing, lazy loading).
2. Check for layout-triggering animations (e.g., animating width/height).
3. Audit external dependencies for tree-shakeability.
4. Run `pnpm build` and review the route size manifest.

---

## 7. Build Failure Recovery
*Resolving CI/CD failures or local build crashes.*

| Role | Agent | Skill |
|---|---|---|
| **Resolver** | `build-error-resolver` | `{nextjs-turbopack}` |

**Workflow:**
1. Analyze build logs for RSC/Client boundary violations.
2. Check `content-collections` for schema mismatches.
3. If persistent, run a full cache reset: `Remove-Item -Recurse -Force .next`.
4. Re-run `pnpm build`.

---

## 8. MDX Content Updates
*Updating portfolio projects, blog posts, or experience.*

| Role | Agent | Skill |
|---|---|---|
| **Validator** | `typescript-reviewer` | `{content-engine}` |

**Workflow:**
1. Update/Add `.mdx` file in `content/`.
2. Verify frontmatter against Zod schema in `content-collections.ts`.
3. If new media is added, use `<ImageShell>` or `<VideoViewer>` components.
4. Run `pnpm typecheck` — schema errors will surface here immediately.

---

## 9. Design System Updates
*Modifying global tokens, typography, or core primitives.*

| Role | Agent | Skill |
|---|---|---|
| **Architect** | `architect` | `{design-system}` |
| **Reviewer** | `code-reviewer` | — |

**Workflow:**
1. Define the change in `app/globals.css`.
2. Grep for all consumers of the modified token/class.
3. Update consumers to prevent visual regressions.
4. Visual QA across all routes and breakpoints.
