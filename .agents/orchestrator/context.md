# Project Context

## Current Workspace
- Root Directory: `C:\Users\Soraw\.gemini\antigravity\scratch\crm-project`
- Local Time: 2026-06-20T11:27:30+07:00

## Key Requirements & Scope
1. **R1. Onboarding & UX Simplification**:
   - Guidance for new users.
   - Interactive tutorials, empty states, tooltips, or progressive disclosure.
   - Explanations of complex dashboard metrics and pipeline stages.
2. **R2. Drag & Drop Performance Fix**:
   - Fix severe freezing, hanging, lagging on the Pipeline page during drags.
   - Investigate react-beautiful-dnd / hello-pangea/dnd re-renders, framer-motion, and Supabase real-time sync refetching during drag.
   - Smooth 60fps drag-and-drop.
   - Async backend update post-drag without interrupting interactions.

## Target Source Files
- `src/pages/PipelinePage.jsx` - Contains the pipeline page logic, stages, and cards.
- `src/pages/CommandCenterPage.jsx` - Primary dashboard containing metrics.
- `src/pages/CustomersPage.jsx` - Customer list.
- `src/components/layout/AppLayout.jsx` - Global layout where an onboarding wrapper or context might be integrated.
- `src/components/pipeline/PipelineBoard.jsx` - Custom Kanban board component (rebuilt in previous task).
- `src/components/pipeline/MonthlyPipeline.jsx` - Main Pipeline wrapper (rebuilt in previous task).

## Dependencies
- `@hello-pangea/dnd`: Drag-and-drop library.
- `framer-motion`: Animations library.
- `@tanstack/react-query`: Server state management.
- `@supabase/supabase-js`: Supabase integration.
