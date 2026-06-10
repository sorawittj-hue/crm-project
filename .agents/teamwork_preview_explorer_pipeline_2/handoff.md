# Handoff Report: Pipeline Page Overhaul Strategy

## 1. Observation
- The `page_pipeline.jsx` currently uses native HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDrop`, etc.). 
- Dragging state is managed manually via `dragId` and `hoverStage` states.
- Clicking a `PipelineCard` triggers a temporary toast message (`pushToast({ emoji: '👁️', title: 'ดูรายละเอียด', ... })`) instead of showing the details.
- `PROJECT.md` dictates the use of `@hello-pangea/dnd` for dragging, `framer-motion` for animations, and a premium "glassmorphism" aesthetic.
- The project appears to use React (React.useState, React.useMemo implied) without import statements in this file, suggesting a global context setup (e.g., UMD imports or an index file that injects React, `framer-motion`, etc. globally).

## 2. Logic Chain
1. **Drag and Drop Replacement**: Native drag-and-drop is clunky and lacks smooth visual feedback. By wrapping the Kanban board in `<DragDropContext>`, columns in `<Droppable>`, and cards in `<Draggable>`, `@hello-pangea/dnd` will handle the layout calculations and smooth animations automatically.
2. **Animation and Glassmorphism**: `framer-motion` should be used for enter/exit animations of the Side Drawer (`AnimatePresence`, `motion.div`) and hover/tap interactions on the Deal Cards (`whileHover`, `whileTap`). Glassmorphism requires CSS `backdrop-filter: blur(...)` combined with translucent background colors.
3. **Side Drawer Context**: Instead of navigating away or using a toast, a sliding drawer from the right side of the screen allows users to inspect deal details. This requires a new `selectedDeal` state in `PipelinePage`.

## 3. Caveats
- Global variables (`TEAM`, `STAGES`, `I`, `formatTHB`) are assumed to be present in the execution environment. The refactor must not break access to these.
- CSS updates will be needed to fully realize the glassmorphism aesthetic. Since the request is focused on `page_pipeline.jsx`, I will assume we can either add inline styles for the new components or the implementer will update `styles.css`.
- The `react-beautiful-dnd` API (which `@hello-pangea/dnd` forks) requires strict adherence to passing `provided.innerRef`, `provided.draggableProps`, and `provided.dragHandleProps`.

## 4. Conclusion
We must implement a three-part refactor on `page_pipeline.jsx`:
1. Introduce a `SideDrawer` component built with `framer-motion` for smooth entry/exit.
2. Overhaul the kanban board structure to use `@hello-pangea/dnd` components (`DragDropContext`, `Droppable`, `Draggable`).
3. Enhance `PipelineCard` with `framer-motion` properties and attach the `dnd` ref/props.

### Step-by-Step Implementation Strategy

**Step 1: Install Dependencies**
Ensure `npm install @hello-pangea/dnd framer-motion` is run in the workspace (or they are added to the global HTML bundle if this is a no-build setup).

**Step 2: Create the `SideDrawer` Component**
Add a new component in `page_pipeline.jsx`:
- Accepts `deal` and `onClose`.
- Uses `<AnimatePresence>` wrapping a `<motion.div>` overlay (with `backdrop-filter: blur(4px)`).
- Uses a nested `<motion.div>` for the right-aligned drawer panel, sliding from `x: "100%"` to `x: 0`.

**Step 3: Refactor `PipelineCard`**
- Change `<div className="pipe-card">` to `<motion.div className="pipe-card" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>`.
- Add `innerRef`, `draggableProps`, and `dragHandleProps` parameters.
- Attach these props to the root `motion.div`.

**Step 4: Refactor `PipelinePage` state and layout**
- Remove `dragId` and `hoverStage`.
- Add `const [selectedDeal, setSelectedDeal] = useState(null);`.
- Implement `onDragEnd(result)` which checks `result.destination`, finds the moved deal, updates its stage, and calls `setDeals`.
- Wrap `<div className="kanban">` in `<DragDropContext onDragEnd={onDragEnd}>`.
- Wrap each column's `<div className="kanban-body">` in `<Droppable droppableId={stage.id}>`.
- Inside the Droppable, map over the deals and wrap `PipelineCard` in a `<Draggable draggableId={d.id} index={index}>`.
- Add the `<SideDrawer />` component at the end of the `PipelinePage` return statement, controlled by `selectedDeal`.

## 5. Verification Method
- **Code validation**: Check that `page_pipeline.jsx` has no syntax errors after modification.
- **Visual/Manual**: Test dragging a card between columns; verify that `@hello-pangea/dnd` handles the visual movement and the drop successfully updates the data.
- **Interaction**: Click a card, verify the drawer slides in from the right. Click the overlay or close button to dismiss it.
