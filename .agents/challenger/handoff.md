# Empirical Verification Report: Pipeline UI

## 1. Observation
1. **Drag-and-Drop Local State Missing**: In `src/components/pipeline/PipelineBoard.jsx`, `processedDeals` is derived directly from the `deals` prop via `useMemo` (lines 94-147). There is no local optimistic array state being updated during `handleDragEnd` (lines 156-170).
2. **Same-Column Reorder Snapping**: In `handleDragEnd`, dragging within the same column triggers `initiateMove` if the indices are different (lines 161-169). However, `initiateMove` only updates the stage and last activity, not the array order.
3. **No Reversion on Modal Cancel**: When a deal is dragged to 'won' or 'lost', `initiateMove` (line 185) eagerly calls `onUpdateDeal(dealId, { stage: targetStage })` BEFORE the user confirms the modal. If the user closes `reasonModal` without confirming, the deal remains in the new stage without a reason or closed date.
4. **Flawed Focus Trap in Side Drawer**: In `src/components/pipeline/MonthlyPipeline.jsx` (lines 64-66, 74-76), `drawerRef.current.querySelectorAll` selects all focusable elements but fails to exclude `:disabled` elements.

## 2. Logic Chain
1. `@hello-pangea/dnd` strictly requires the `deals` list to be immediately and synchronously reordered in React state upon `onDragEnd`, otherwise the dropped card visually snaps back ("sticks"). Since `PipelineBoard` waits on the parent's `onUpdateDeal` to flow back down via props (which is typically async), the UI will stick.
2. When dragging within the same column, the application calls `onUpdateDeal` with the *same stage*. The parent backend receives this, does not know the new index (since the backend/API structure for ordering isn't invoked here), and returns the same list. The dragged item snaps back to its original spot.
3. Calling `onUpdateDeal` prior to `WinLossModal` confirmation creates a premature mutation. If the user clicks `onClose` inside the modal, there is no code block that calls `onUpdateDeal(dealId, { stage: originalStage })`. The deal is permanently trapped in 'won'/'lost' state but violates data integrity (missing `close_reason`).
4. In the side drawer, if the first or last focusable element in the DOM tree is `disabled` (e.g., a disabled 'Save' button at the bottom), the browser will naturally skip it when the user presses Tab. The condition `document.activeElement === last` evaluates to false, failing to loop focus back to `first`. Focus thus escapes the drawer entirely, violating accessibility guidelines.

## 3. Caveats
- Runtime verification using `run_command` was constrained due to environmental timeout permissions. Findings are derived via adversarial static path analysis of React state lifecycles and `@hello-pangea/dnd` behaviors.
- The project may not support same-column reordering on the backend, but if so, it should strictly `return` on same-column drags instead of dispatching a network call.

## 4. Conclusion
**Overall risk assessment**: HIGH.

The bug fixes to the Pipeline UI have critical gaps:
1. Drag-and-drop will still **stick visually** due to lack of local optimistic array reordering.
2. The UI is **data-destructive** when users cancel the Win/Loss modal.
3. The accessibility focus trap is **fragile** and will break when disabled buttons are present.

**Recommended Actions for Implementer:**
- Implement a `const [optimisticDeals, setOptimisticDeals] = useState(deals)` inside `PipelineBoard` to handle synchronous list updates for `dnd`.
- Pass `originalStage` to `reasonModal` state and revert `onUpdateDeal` if the modal fires `onClose`. Or better: defer calling `onUpdateDeal` entirely until the modal is actually submitted.
- Update `querySelectorAll` strings to include `:not(:disabled)` inside `MonthlyPipeline.jsx`.
- If same-column reordering is unsupported, explicitly check `if (source.droppableId === destination.droppableId) return;` at the top of `handleDragEnd`.

## 5. Verification Method
1. **Drag-and-Drop Sticking**: Throttle network speed in browser DevTools. Drag a deal to another column. Observe it snap back to its origin while the network request is pending.
2. **Modal Cancel Data Corruption**: Drag a deal to "won". The modal pops up. Click "Cancel". Observe the deal visually remains in the "won" column but has no reason assigned. Refresh the page to see it persisting.
3. **Focus Trap Escaping**: Open the Sidebar Drawer. Ensure the bottom-most button is disabled. Press `Tab` continuously. Observe focus escape into the browser URL bar or background page elements.
