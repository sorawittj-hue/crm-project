# Project: CRM Onboarding & Drag-and-Drop Performance

## Architecture
- **Onboarding UX**: Global layout component (`src/components/layout/AppLayout.jsx`) wraps the pages, allowing an onboarding tour context to trigger tooltips or interactive guide cards across the CommandCenter, Customers, Pipeline, and Analytics pages.
- **Pipeline Kanban & Drag-and-Drop**: `src/pages/PipelinePage.jsx` and its sub-components manage deal stages. The drag-and-drop mechanism is implemented using `@hello-pangea/dnd`. State updates must be optimized to prevent full-page re-render cascades and to throttle/pause database refetching during active drag operations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration | Analyze DND lag triggers and onboarding design options. | none | DONE |
| 2 | Onboarding UX | Design and implement the beginner-friendly onboarding flow and dashboard metric explanations. | M1 | DONE |
| 3 | DND Performance | Fix drag-and-drop lag and freeze by optimizing state and sync mechanisms on the Pipeline page. | M1 | DONE |
| 4 | Verification | Execute review, stress testing, and forensic audit to ensure all acceptance criteria are met. | M2, M3 | PLANNED |

## Code Layout
- `src/components/layout/AppLayout.jsx` — Layout wrapper.
- `src/pages/CommandCenterPage.jsx` — CommandCenter dashboard metrics page.
- `src/pages/PipelinePage.jsx` — Pipeline Kanban page.
- `src/pages/CustomersPage.jsx` — Customers list page.
- `src/pages/AnalyticsPage.jsx` — Analytics dashboard page.
- `src/components/pipeline/PipelineBoard.jsx` — Board implementation.
- `src/components/pipeline/MonthlyPipeline.jsx` — Pipeline parent wrapper.
