# Pipeline Page Iteration 3 QA Veto Analysis

## 1. Observation
- `src/components/pipeline/PipelineBoard.jsx:156`: `handleDragEnd` does not implement local reordering inside the same droppable column. Instead, it falls through to `initiateMove`, which triggers an update for the same stage. If the stage is 'won' or 'lost', it immediately calls `setReasonModal`.
- `src/components/pipeline/PipelineBoard.jsx:185`: `initiateMove` immediately calls `onUpdateDeal` followed by `setReasonModal`. There is no `optimisticDeals` state; it operates strictly on the `deals` prop passed down from `MonthlyPipeline.jsx`.
- `src/components/pipeline/PipelineBoard.jsx:442`: `WinLossModal` onClose simply does `setReasonModal({ open: false, ... })` with no state revert logic.
- `src/components/pipeline/MonthlyPipeline.jsx:80`: The focus trap inside `handleKeyDown` queries for `button, input, ...` and filters them out only using `!el.hasAttribute('disabled')`. It relies strictly on `document.activeElement === first` or `document.activeElement === last` to wrap focus.

## 2. Logic Chain
- **Optimistic State Missing**: Because `PipelineBoard` does not maintain a local array that instantly updates, the dragging UI relies on full parent re-renders. Dragging within the same column is ignored by the backend, leading to complete failure to persist or show reordering visually.
- **Immediate Update & Revert Bug**: By calling `onUpdateDeal` before the modal even accepts a reason, the backend is mutated to the target stage immediately. Canceling the modal does nothing to the backend, leaving the deal effectively "won/lost" without any required metadata.
- **Reorder Triggers Modal**: Since same-column drag falls through to `initiateMove`, dropping a deal in 'won' (at a different index) calls `initiateMove(dealId, 'won')`. This satisfies `targetStage === 'won'`, incorrectly opening the modal again.
- **Drawer Focus Trap**: The DOM includes disabled elements (via React's `disabled={true}`) or conditionally hidden tabs that are not visible. The browser automatically skips them during Tabbing. Since the trap only triggers when exactly on `last`, and `last` is un-focusable, the trap is never triggered. The user tabs onto the element before `last`, the browser looks for the next focusable element, skips the invisible `last`, and escapes the drawer.

## 3. Caveats
- Reordering deals locally inside `optimisticDeals` will provide visual order, but without a dedicated `order` property in the backend schema, the order will reset on refresh. This is typical for Kanban without a sort order schema, so a local-only reorder (which fixes the visual glitch and prevents modal popups) is sufficient.
- The Drawer focus trap issue is resolved best by combining `:not([disabled])` and an overarching escape check `!drawerRef.current.contains(...)`.

## 4. Conclusion
1. Implement a true `optimisticDeals` state array synced with the `deals` prop in `PipelineBoard.jsx`.
2. Delay the `onUpdateDeal` call until the Win/Loss modal is confirmed for those stages.
3. Handle same-column dropping locally inside `optimisticDeals` and return early.
4. Refactor `MonthlyPipeline` focus trap to check element visibility (`offsetWidth > 0`) and force focus inside `drawerRef` if `document.activeElement` leaves the drawer scope.

## 5. Verification Method
- Drag a deal within 'won'. Ensure no modal opens and order persists locally.
- Drag a deal to 'won', cancel modal. The deal should snap back to its original stage immediately.
- Open Deal Detail drawer, tab backward/forward repeatedly past the end. Ensure focus properly wraps and does not escape to the background app navigation.
