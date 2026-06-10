# Handoff Report: Pipeline Bugs Fix Strategy

## 1. Observation
- **Bug 1 (Drag-and-Drop Snapback):** In `src/components/pipeline/PipelineBoard.jsx:186`, `initiateMove` checks if `targetStage === 'won' || targetStage === 'lost'`. If so, it calls `setReasonModal({ open: true, dealId, targetStage })` but does not trigger `onUpdateDeal`. Consequently, `dealsByStage` remains unchanged, and `@hello-pangea/dnd` returns the dragged card to its original column.
- **Bug 2 (Drag-and-Drop Visual Stickiness):** In `PipelineBoard.jsx:474`, the `DealCard` component renders a `<motion.div>` with `{...draggableProps}` and `animate={{ scale: 1.05, rotate: 2 }}`. Framer Motion overwrites the `style.transform` provided by `draggableProps`, effectively nullifying the library's active drag translation.
- **Bug 3 (Accessibility in Drawer):** In `src/components/pipeline/MonthlyPipeline.jsx:177`, the right-side details drawer is implemented as a `<motion.div>` conditionally rendered inside `<AnimatePresence>`. It lacks `role="dialog"`, `aria-modal="true"`, and any focus trap mechanism. However, `package.json` confirms `@radix-ui/react-dialog` is installed.

## 2. Logic Chain
1. **Snapback Fix:** `@hello-pangea/dnd` relies entirely on the React component state instantly reflecting the drop to prevent visual snapback. By maintaining an `optimisticDeals` state that maps `dealId -> targetStage`, we can override the local `dealsByStage` representation while the modal is open, tricking the list into keeping the card in the new column until the API call or a cancellation.
2. **Visual Stickiness Fix:** The `transform` conflict can be resolved by wrapping the card. If the outermost element is a standard `<div>` holding `ref`, `draggableProps`, and `dragHandleProps`, `@hello-pangea/dnd` will control its `translate`. Placing the `<motion.div>` inside it will allow Framer Motion to handle the `scale` and `rotate` animations independently without clobbering the outer `div`'s `transform`.
3. **Accessibility Fix:** Because `@radix-ui/react-dialog` is already a dependency, we can wrap the existing drawer `<AnimatePresence>` block in a `<Dialog.Root>`. Utilizing `<Dialog.Portal>`, `<Dialog.Overlay asChild>`, and `<Dialog.Content asChild>`, we can maintain the exact same Framer Motion animations while automatically inheriting the focus trap, screen reader roles, and keyboard navigation (like `Esc` to close).

## 3. Caveats
- For Bug 1, if a user closes the `WinLossModal` without saving, the `optimisticDeals` state must be cleared so the deal card snaps back to its original location. This requires passing an appropriate reset handler to the `WinLossModal`'s `onClose` prop.
- For Bug 3, using `@radix-ui/react-dialog` will impose a `<Dialog.Overlay>` which locks scrolling natively (using Radix's implementation). We must ensure it plays well with the existing `MonthlyPipeline.jsx` layout.

## 4. Conclusion
The implementation agent should execute three changes:
1. **Add Optimistic DND State:** In `PipelineBoard.jsx`, introduce a `const [optimisticDeals, setOptimisticDeals] = useState({})`. Merge this into the deals mapping in `dealsByStage` to force the card into its target column while `reasonModal` is open. Clear the optimistic state inside `submitReason` and `WinLossModal`'s `onClose`.
2. **Separate Wrapper Elements for DND:** In `PipelineBoard.jsx` inside the `DealCard` component, create an outer `<div>` for `ref`, `draggableProps`, and `style`. Move the `<motion.div>` containing the `scale` and `rotate` animations inside of it. Ensure `isDragging ? { zIndex: 9999 } : {}` is added to the outer div's style.
3. **Integrate Radix Dialog:** In `MonthlyPipeline.jsx`, import `* as DialogPrimitive from '@radix-ui/react-dialog'`. Wrap the drawer section in `<DialogPrimitive.Root open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>`. Use `<DialogPrimitive.Portal forceMount>`, `<DialogPrimitive.Overlay asChild>`, and `<DialogPrimitive.Content asChild>` around the Framer Motion elements to satisfy all accessibility requirements.

## 5. Verification Method
- **Bug 1:** Drag a deal to the "Won" column. The card should sit visibly in the "Won" column while the modal is open. Click "Cancel" on the modal; the card should revert to its original column.
- **Bug 2:** Drag any deal card. It should follow the cursor precisely without snapping or sticking, while also slightly rotating and scaling up.
- **Bug 3:** With the Deal details drawer open, press `Tab` repeatedly. Focus should trap inside the drawer and not reach the background elements. Screen readers should announce it as a dialog.
