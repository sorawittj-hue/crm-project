# Pipeline Page Bug Analysis

## 1. Incomplete Optimistic State Update
**Observation**: `PipelineBoard.jsx` does not implement local optimistic state. Drag-and-drop operations directly call `onUpdateDeal(dealId, ...)` which relies entirely on the parent `MonthlyPipeline` passing down updated `deals`.
**Reason**: Without an `optimisticDeals` local state array that immediately reflects dragging changes, the board feels laggy. The local reordering logic inside `handleDragEnd` is completely missing.

## 2. Immediate Backend Update on Won/Lost
**Observation**: In `PipelineBoard.jsx`, `initiateMove` immediately calls `onUpdateDeal` before opening the modal:
```javascript
  const initiateMove = (dealId, targetStage) => {
    onUpdateDeal(dealId, { stage: targetStage, last_activity: new Date().toISOString() });
    if (targetStage === 'won' || targetStage === 'lost') {
      setReasonModal({ open: true, dealId, targetStage });
    }
  };
```
**Reason**: Because `onUpdateDeal` is called first, the backend saves the stage as 'won'/'lost'. If the user then cancels the Win/Loss modal, there is no logic to revert the change in the backend, leaving the deal stuck in 'won'/'lost' without a reason.

## 3. Reordering Triggers Win/Loss Modal
**Observation**: In `handleDragEnd` of `PipelineBoard.jsx`, the code checks:
```javascript
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
```
If the user reorders an item within the same column (`destination.index !== source.index`), it falls through to:
```javascript
    const targetStage = destination.droppableId;
    initiateMove(draggableId, targetStage);
```
**Reason**: Dragging inside the same 'won' or 'lost' column calls `initiateMove` with the same stage, which re-triggers the `setReasonModal` blindly.

## 4. Drawer Focus Trap Fails on Disabled Elements
**Observation**: In `MonthlyPipeline.jsx`, the focus trap relies on finding the `first` and `last` focusable elements. If an element is hidden (`display: none`) or unfocusable by the browser but still caught by the `querySelectorAll` logic, the browser will skip it. 
**Reason**: If the `last` element in the `focusable` array is skipped by the browser, the user will tab out of the drawer because `document.activeElement` will never equal `last`. The trap needs to filter out hidden elements (`offsetWidth > 0`) and use a fallback `!drawerRef.current.contains(document.activeElement)` to forcibly pull focus back if it escapes.

## Fix Strategy
1. **PipelineBoard.jsx**:
   - Add `const [optimisticDeals, setOptimisticDeals] = useState(deals);` and sync it via `useEffect`.
   - Update `handleDragEnd` to correctly update the local array for same-column reordering and `return` immediately.
   - In `initiateMove`, locally update `optimisticDeals`. If moving to 'won'/'lost', *only* open the modal and skip calling `onUpdateDeal`.
   - Add `onClose` logic in the modal to revert `optimisticDeals` back to `deals` if canceled.
2. **MonthlyPipeline.jsx**:
   - Update the focus trap in `handleKeyDown` to exclude disabled elements in the query (`:not([disabled])`), filter out hidden elements (`el.offsetWidth > 0`), and catch escaped focus with `!drawerRef.current.contains(document.activeElement)`.
