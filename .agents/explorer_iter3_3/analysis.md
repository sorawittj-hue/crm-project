# Analysis Report: Pipeline Fixes

## 1. Why was the optimistic state update incomplete?
The previous iteration failed to introduce an actual local state variable (`optimisticDeals`) that would consistently replace the prop `deals` across `PipelineBoard.jsx`. Because the board still largely rendered directly from the `deals` prop, local updates either failed to appear or vanished mid-render, leading to an incomplete optimistic state.

## 2. Why did dragging to won/lost update the backend before the modal opens, and how to safely revert if the modal is canceled?
The bug (Optimistic Update Revert Bug) was caused by `initiateMove` immediately calling `onUpdateDeal` with the new target stage, even if the target stage was `'won'` or `'lost'`. 
To fix this:
- We now update `optimisticDeals` locally so the item visually moves to the new column immediately.
- We check if `targetStage === 'won' || targetStage === 'lost'`. If so, we open the reason modal and **skip** the `onUpdateDeal` call.
- If the user confirms, `submitReason` handles updating the backend (`onUpdateDeal`).
- If the user cancels, `closeReasonModal` resets `optimisticDeals` back to `deals`, reverting the optimistic UI cleanly without dirtying the backend.

## 3. Why did reordering in won/lost trigger the modal?
The previous code in `handleDragEnd` had a guard clause:
```javascript
if (destination.droppableId === source.droppableId && destination.index === source.index) return;
```
If a user reordered a deal within the same column (so `destination.index !== source.index`), it bypassed this check and proceeded to call `initiateMove(draggableId, destination.droppableId)`. Since the destination column was `'won'`, `initiateMove` falsely interpreted this as a stage change to `'won'` and triggered the modal.

We fixed this by intercepting `destination.droppableId === source.droppableId` regardless of index. We now only reorder `optimisticDeals` locally to visually stick the deal where dropped, and return early so `initiateMove` is never called.

## 4. Why did the Drawer focus trap fail when the first/last elements are disabled?
In `MonthlyPipeline.jsx`, the focus trap used `drawerRef.current.querySelectorAll()` to grab all focusable elements (buttons, inputs, etc.) and blindly called `.focus()` on the first/last elements during tabbing. However, standard query selectors grab `<button disabled>` as well. A disabled element cannot be focused, meaning `.focus()` did nothing and allowed the focus to escape the trap or skip to the browser UI.

We fixed this by filtering the result array:
```javascript
const focusableElements = Array.from(drawerRef.current.querySelectorAll(...))
  .filter(el => !el.hasAttribute('disabled'));
```
Now, only truly focusable active elements are considered for the first and last bounds of the focus trap.
