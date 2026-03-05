---
title: Sales Leader UX Upgrade & Express PDF Importer Planning
status: draft
---

# Feature: Sales Leader UX Upgrade & Express PDF Importer

## Task Breakdown
### Phase 1: PDF Importer Core (Data Entry)
- **Task 1.1:** Install and configure `pdfjs-dist` for client-side text extraction.
- **Task 1.2:** Implement the `ExpressPdfUploader` UI component (Drag & Drop zone).
- **Task 1.3:** Create the text extraction and Gemini API structuring logic (Prompt Engineering).
- **Task 1.4:** Build the `DataVerificationModal` to let users review the AI's output.
- **Task 1.5:** Wire the modal to save the deal into Supabase at the "Proposal" stage with an auto-generated follow-up task.

### Phase 2: Leader Dashboard & Gamification
- **Task 2.1:** Create the `GoalProgressWidget` component.
  - Implement the 10M overall target.
  - Implement the split: 7M for Leader, 3M for Team.
  - Calculate current actuals based on "Won" deals in the database.
- **Task 2.2:** Create the `TeamActivityFeed` component by aggregating recent notes, tasks, and deal creations.
- **Task 2.3:** Integrate these widgets into the main Dashboard view.

### Phase 3: Pipeline UX/UI Revamp
- **Task 3.1:** Update the `DealCard` component design.
- **Task 3.2:** Implement "Stagnant Deal" visual highlighting (e.g., orange border if no activity for 3 days).
- **Task 3.3:** Add 1-Click Quick Action icons (Note, Task, Call) directly on the `DealCard`.
- **Task 3.4:** Polish animations (drag-and-drop transitions, hover effects).

## Dependencies
- `pdfjs-dist` package.
- `lucide-react` for new UI icons.
- Existing Gemini API setup in the app.

## Effort Estimates
- Phase 1 (PDF Importer): 3-4 hours
- Phase 2 (Dashboard): 2-3 hours
- Phase 3 (Pipeline UX): 2 hours

## Implementation Order
1. **Phase 2 (Dashboard)**: Start with the Gamification visual impact to immediately motivate the user.
2. **Phase 3 (Pipeline UX)**: Improve the daily workflow tool.
3. **Phase 1 (PDF Importer)**: Implement the complex data extraction step last.

## Risks and Mitigation
- **Risk:** `pdfjs-dist` setup in Vite/React can sometimes be tricky with web workers.
  - **Mitigation:** Use a CDN link for the worker or follow explicit Vite configuration guidelines.
- **Risk:** AI parsing is inaccurate.
  - **Mitigation:** The `DataVerificationModal` ensures human oversight before database insertion.
