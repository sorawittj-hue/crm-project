# Pipeline Fix Analysis - Iteration 3

## 1. Incomplete Optimistic State Update
**Cause:** `PipelineBoard.jsx` had no local state for deals. `processedDeals` was computed directly from the `deals` prop (`deals.map(...)`). When a deal was dragged, there was no way to instantly update the UI unless the parent provided immediate prop updates.
**Fix Strategy:** Added a `localDeals` state, initialized and synced with the `deals` prop. Replaced `deals.map` with `localDeals.map` when computing `processedDeals`. Now we can optimistically update `localDeals` internally, providing immediate visual feedback on drag-and-drop.

## 2. Optimistic Update Revert Bug (Modal Cancellation)
**Cause:** In `PipelineBoard.jsx`, when a deal was dropped into the 'won' or 'lost' columns, `initiateMove` immediately called `onUpdateDeal` (mutating backend/parent state) *before* the Win/Loss modal was shown. If the user clicked "Cancel" on the modal, it only closed the dialog (`setReasonModal({ open: false })`), leaving the deal trapped in 'won'/'lost' without a win/loss reason.
**Fix Strategy:** For 'won' and 'lost' stages, `initiateMove` now *only* updates the local optimistic state (`localDeals`) and opens the modal. `onUpdateDeal` is delayed until the user confirms the modal (`submitReason`). A new `closeReasonModal` function was added to handle cancellation by resetting `localDeals` back to the original `deals` prop.

## 3. Reordering Triggers Win/Loss Modal
**Cause:** In `handleDragEnd`, a drop within the same column evaluated `destination.droppableId === source.droppableId`. If the item's position changed (`destination.index !== source.index`), the code blindly called `initiateMove(draggableId, targetStage)`. If this was the 'won'/'lost' column, `initiateMove` popped the modal again.
**Fix Strategy:** Added an early return condition in `handleDragEnd` for same-column drops. It now performs a local array reorder (updating `localDeals` indices) to preserve the UI state during the session without calling `initiateMove` or `onUpdateDeal`.

## 4. Drawer Focus Trap Failure
**Cause:** In `MonthlyPipeline.jsx`, the focus trap `useEffect` used a generic CSS selector: `'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'`. This selector matched disabled buttons. Since disabled elements are natively unfocusable, calling `.focus()` on `first` or `last` would fail or let focus escape to the browser UI, breaking the trap loop.
**Fix Strategy:** Updated the selector string to explicitly exclude disabled elements: `'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'`.
