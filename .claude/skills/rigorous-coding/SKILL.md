---
name: rigorous-coding
description: Apply rigorous coding standards and structured implementation workflow. Use when writing, implementing, or reviewing code. ALWAYS invoke before any implementation task.
---

# Rigorous Coding

## Before Writing Any Code

1. State your assumptions explicitly
2. Identify what conditions this code must handle (happy path, errors, edge cases)
3. Do not claim correctness you haven't verified

## Implementation Workflow

When implementing features or fixing bugs, follow this exact loop:

### Step 1: Create Task Plan

Create `task_plan.md` in the project root (or user-specified file):

```markdown
# Task Plan: [Brief Description]

## Goal
[One sentence: what does "done" look like]

## Features / Steps
- [ ] Feature 1: [description]
- [ ] Feature 2: [description]
- [ ] Feature 3: [description]

## Current
**Working on**: Feature 1
**Status**: in_progress

## Decisions
- [Decision]: [Why]

## Errors
- [Error]: [Resolution]
```

Also create TodoWrite items mirroring the features for real-time user visibility.

### Step 2: Execute Sequentially (NON-NEGOTIABLE)

For EACH feature/step:

```
1. Mark feature as in_progress (both task_plan.md and TodoWrite)
2. Implement the feature
3. Test the feature — verify it passes
4. Run lsp_diagnostics on changed files
5. Mark feature as completed (both task_plan.md and TodoWrite)
6. Update task_plan.md "Current" section to next feature
7. ONLY THEN proceed to next feature
```

**NEVER skip testing between features. NEVER proceed to feature 2 with feature 1 failing.**

### Step 3: Completion

Before reporting done:

- [ ] All features in task_plan.md marked `[x]`
- [ ] All TodoWrite items marked completed
- [ ] `lsp_diagnostics` clean on all changed files
- [ ] Build passes (if project has build command)
- [ ] Update task_plan.md status to "Complete"

## Bugfix Rule

Fix the bug minimally. Do NOT refactor surrounding code while fixing. One concern per change.

## When to Skip the Task Plan File

- Single-file bug fix with obvious cause
- One-step change (rename, add a field, fix a typo)
- User explicitly says "just do X" for a trivial task

For these: still use TodoWrite, still test before reporting done. Skip the file.
