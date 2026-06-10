# Handoff Report: Pipeline Redesign Strategy

## 1. Observation
- `package.json` had `framer-motion` installed, but not `@hello-pangea/dnd`. I have run `npm install @hello-pangea/dnd` and it completed successfully.
- `page_pipeline.jsx` lines 14-47 define `PipelineCard`, which uses native HTML drag events (`draggable`, `onDragStart`, `onDragEnd`).
- `page_pipeline.jsx` lines 122-164 map over `STAGES` to render `kanban-col` and uses native drop events (`onDragOver`, `onDragLeave`, `onDrop`).
- `page_pipeline.jsx` line 152: clicking a deal triggers `pushToast({ emoji: '👁️', title: 'ดูรายละเอียด', body: d.company })`.
- `styles.css` has existing variables for colors and borders, but does not have a predefined drawer component. It has some glassmorphism patterns in `.app-header` (`background: rgba(255,255,255,.75); backdrop-filter: blur(10px);`).

## 2. Logic Chain
1. To replace native DnD with `@hello-pangea/dnd`, we need to wrap the kanban columns in `<DragDropContext onDragEnd={handleDragEnd}>`.
2. Each kanban column needs to be wrapped in `<Droppable droppableId={stage.id}>`.
3. Each `PipelineCard` needs to be wrapped in `<Draggable draggableId={deal.id.toString()} index={index}>`.
4. The native drag states (`is-dragging`, `is-hover`) should be replaced by relying on `snapshot.isDragging` and `snapshot.isDraggingOver` from `@hello-pangea/dnd`.
5. For the side drawer, since clicking a deal currently just pushes a toast, we should add a `selectedDeal` state to `PipelinePage`.
6. We can create a `SideDrawer` component within `page_pipeline.jsx` using `framer-motion` (`AnimatePresence` and `motion.div`). It will animate from `x: "100%"` to `x: 0`. We can use the glassmorphism approach already present in `.app-header` for the drawer background.

## 3. Caveats
- `page_pipeline.jsx` is exposed globally via `window.PipelinePage = PipelinePage;` at the end of the file. Ensure the exports remain unchanged to not break the routing defined in `shell.jsx`.
- Strict Mode is likely on for this React 18 app, which is why `@hello-pangea/dnd` is crucial as it resolves React 18 strict mode issues found in `react-beautiful-dnd`.
- `@hello-pangea/dnd` requires the `index` prop for each `Draggable`. Make sure `col.map((d, index)` is used to get the index.

## 4. Conclusion
**Implementation Strategy:**

**Step 1: Create `SideDrawer` Component**
Add the `SideDrawer` component at the top of `page_pipeline.jsx` (before `PipelineCard`). Use `framer-motion` for slide-in animation.
```jsx
const { motion, AnimatePresence } = window.Motion || require('framer-motion'); // Adjust import based on setup
function SideDrawer({ deal, onClose }) {
  // Render deal details. Use framer-motion AnimatePresence wrapping the component call or inside.
}
```
*Note: Make sure to import `motion` and `AnimatePresence` from `framer-motion` at the top of `page_pipeline.jsx`.*

**Step 2: Update `PipelinePage` state and handlers**
- Replace `pushToast` on card click with `setSelectedDeal(d)`.
- Render `<SideDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />` conditionally.
- Import `DragDropContext`, `Droppable`, `Draggable` from `@hello-pangea/dnd`.
- Create a `handleDragEnd(result)` function. If `!result.destination` return early. Otherwise, calculate the new stage and update `deals`. Remove native `dragId` and `hoverStage` states.

**Step 3: Update JSX to use `@hello-pangea/dnd`**
- Wrap `.kanban` inside `<DragDropContext onDragEnd={handleDragEnd}>`.
- Inside the `.kanban` iteration, wrap `.kanban-body` children inside `<Droppable droppableId={stage.id}>`.
- Inside `<Droppable>`, map over deals and render `PipelineCard` wrapped in `<Draggable draggableId={d.id.toString()} index={index}>`.
- Pass `provided.innerRef`, `...provided.droppableProps` to `.kanban-body` and `{provided.placeholder}` at the end.
- Pass `provided.innerRef`, `...provided.draggableProps`, `...provided.dragHandleProps` to `.pipe-card`.

**Step 4: Enhance UI with Framer Motion**
- Add micro-animations (e.g., `whileHover={{ y: -2 }}`) to the `PipelineCard` by converting the outer div to `<motion.div>`.
- Use `backdrop-filter: blur(12px)` and `background: rgba(255,255,255,0.8)` for the `SideDrawer` to achieve glassmorphism. Add standard CSS to `styles.css` if necessary, or just inline styles for the drawer.

## 5. Verification Method
- Code compilation: Run `npm run build` or rely on Vite's HMR without errors.
- Visual/E2E test:
  1. Open the Pipeline page in the browser preview.
  2. Drag a deal from one column to another. Ensure it updates.
  3. Click a deal card. Ensure the `SideDrawer` slides in from the right edge smoothly.
  4. Click a close button or backdrop to close the drawer.
