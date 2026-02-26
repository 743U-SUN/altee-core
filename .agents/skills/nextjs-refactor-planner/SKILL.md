---
name: nextjs-refactor-planner
description: Analyzes a React/Next.js directory, determines component dependencies (Client vs. Server), and generates a step-by-step refactoring plan. Use this skill BEFORE refactoring a directory to create a systematic, bottom-up plan that utilizes existing skills (vercel-react-best-practices, next-best-practices, next-cache-components).
---

# Next.js Refactor Planner

This skill analyzes a specific directory and its files to generate a strategic, step-by-step refactoring plan (`refactor-plan.md`). It ensures that refactoring is done systematically, starting from the leaf (dependency) components up to the main pages, separating the "Planning" and "Execution" phases to maintain context and avoid hallucinations.

## Workflow

When the user asks to plan a refactor for a directory (e.g., `app/demo/design/`), follow these steps in order:

### Phase 1: Context & Dependency Analysis
1. Use the `list_dir` tool to scan the target directory and list all `.ts` and `.tsx` files.
   - *Note: If the directory contains more than 10 files, consider breaking the plan into multiple phases or sub-directories to maintain focus.*
2. Use the `grep_search` tool to efficiently search for `"use client"` directives and import statements to understand the dependency tree.
3. Identify which files are Server Components and which are Client Components.
4. Outline a bottom-up refactoring order (from leaf components that depend on nothing, up to the parent `page.tsx`).

### Phase 2: Generate Refactoring Plan
Create a file in the `docs/REFACTOR/` directory (create the directory if it doesn't exist). The file MUST be named using a timestamp and a descriptive name representing the target, in the format: `yyyymmdd-<descriptive-name>-refactor-plan.md` (e.g., `20260225-admin-links-refactor-plan.md`). Ensure that you generate the current timestamp in `yyyymmdd` format based on the system's current date. The plan MUST use checkboxes for tracking progress, explicitly state which skills to use, and include verification steps.

#### Format Template for Refactoring Plan

```markdown
# Refactoring Plan: [Target Directory]

## Overview
Briefly describe the target directory and its architecture (Client/Server boundaries).

## Step-by-Step Refactoring Tasks
*(List files in bottom-up dependency order. For each file, specify the exact skills to be applied in order.)*

### [1] Leaf Component: `path/to/LeafComponent.tsx`
- [ ] **Step 1-A**: Review & Refactor with `vercel-react-best-practices`
  - *Goal*: Optimize React fundamentals (state, effects, renders).
- [ ] **Step 1-B**: Review & Refactor with `next-best-practices`
  - *Goal*: Verify Next.js App Router conventions and boundaries.
- [ ] **Step 1-C**: Review & Refactor with `next-cache-components`
  - *Goal*: Apply caching strategies (Skip if strictly a client-only component with no data fetching/cache needs).
- [ ] **Step 1-D**: Verification & Testing
  - *Goal*: Run linter/type checks or Next.js build to ensure no breaking changes were introduced.

### [2] Parent Component: `path/to/ParentComponent.tsx`
- [ ] **Step 2-A**: Review & Refactor with `vercel-react-best-practices`
...

### [N] Main Page: `path/to/page.tsx`
...
```

### Phase 3: Handoff
After generating the refactoring plan file, inform the user that the plan is ready. Provide them with the exact filepath to the saved plan. Advise them to proceed by asking you to execute the first step of the plan. Do **NOT** start modifying code during this planning phase.

## Rules
- **No Code Modifications**: DO NOT rewrite or refactor the actual code during this phase. This skill is STRICTLY for analysis and planning.
- **Skill Filtering**: Skip irrelevant skills in the generated plan if a component clearly doesn't need them (e.g., do not suggest caching review for a pure UI component).
- **External Dependencies**: If components import from outside the target directory (e.g., `components/ui/`), treat those external files as OUT OF SCOPE. Do not include them in the refactoring plan unless explicitly requested by the user.
