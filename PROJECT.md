# Project Overview

## Scope
Redesign and overhaul the Pipeline page in a React CRM application to drastically improve mouse interactions and UI/UX to a premium level.

## Requirements
1. Implement drag-and-drop using `@hello-pangea/dnd`.
2. Deals should open in a Side Drawer component (slide from right) to show and edit details without losing context.
3. UI/UX: Premium design, modern aesthetics (glassmorphism, vibrant HSL, framer-motion animations).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Setup & Install | Install `@hello-pangea/dnd`. | none | DONE |
| 2 | Side Drawer | Update `MonthlyPipeline.jsx` and `DealDetailSidebar.jsx` to use a Framer Motion side drawer instead of a Dialog modal. | none | DONE |
| 3 | Board Overhaul | Rewrite `PipelineBoard.jsx` to use `@hello-pangea/dnd`. Apply premium UI/UX styles. | M1, M2 | DONE |
| 4 | Verification | Ensure E2E programmatic structure and visual interactions work properly. | M3 | DONE |

## Code Layout
- `src/components/pipeline/PipelineBoard.jsx` (Kanban and Cards)
- `src/components/pipeline/MonthlyPipeline.jsx` (Parent wrapper with Dialog)
- `src/components/pipeline/DealDetailSidebar.jsx` (The actual detail content)
