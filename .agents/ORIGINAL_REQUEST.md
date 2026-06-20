# Original User Request

## 2026-06-20T04:27:00Z

**Project Description:** 
1. Implement a comprehensive onboarding experience or UX simplifications to make the complex CRM intuitive for beginner users. The teamwork agents will decide the best approach.
2. Diagnosing and permanently fixing the severe drag-and-drop lag/freezing issue on the Pipeline page (potentially caused by React re-render cascades or real-time sync refetches during drag operations).

Working directory: C:\Users\Soraw\.gemini\antigravity\scratch\crm-project
Integrity mode: development

## Requirements

### R1. Beginner-Friendly Onboarding & UX Simplification
Analyze the current CRM UI and implement a solution to guide new users. The agents have the freedom to decide the best approach (e.g., interactive tutorials, tooltips, empty states, progressive disclosure). The goal is that a complete beginner understands what each section does without feeling overwhelmed.

### R2. Drag & Drop Performance Fix (Pipeline Page)
Fix the freezing, hanging, and lagging issues when dragging deals between stages in the Pipeline board. The fix must ensure that dragging a deal remains consistently smooth (60fps) even when there are many deals. (Hint: investigate if `react-beautiful-dnd` or `framer-motion` is causing full-page re-renders, or if Supabase real-time sync is triggering a React Query refetch loop *during* the drag operation).

## Acceptance Criteria

### Onboarding & UX
- [ ] A new user onboarding mechanism or UX simplification is successfully implemented and accessible to beginners.
- [ ] Complex dashboard metrics and pipeline stages have clear, beginner-friendly explanations or indicators.

### Drag & Drop Performance
- [ ] Dragging a deal across columns does not cause the browser to freeze or drop frames.
- [ ] Updating a deal's stage updates the backend without interrupting the user's ongoing interaction.
