---
name: react-query-dnd-optimizer
description: >-
  Cognitive instruction-only skill to audit, optimize, and debug React Query
  optimistic update caching, race conditions, and Kanban board drag-and-drop
  glitches in React applications.
---

# React Query & DND Kanban Optimizer

## Overview
This skill provides a cognitive workflow for coding assistants to audit, diagnose, and optimize Kanban boards utilizing `@hello-pangea/dnd` (or `react-beautiful-dnd`) coupled with `@tanstack/react-query`. It specializes in fixing card-jumping race conditions, correcting cache query key mismatches during optimistic updates, and styling premium drag-and-drop feedbacks.

## Dependencies
None.

## Quick Start
To diagnose and optimize a sluggish or glitchy Kanban board, perform these three audits:
1. **Cache Key Audit**: Verify if optimistic updates (`onMutate`) match the exact query keys currently loaded in the UI (e.g. including user IDs or filters).
2. **Race Condition Audit**: Check if secondary mutations (like automatic task creation) invalidate the primary query before the main database save completes.
3. **Drop Target Visuals**: Ensure columns utilize active drag-over states and cards use spring-based transitions instead of clashing CSS transitions.

## Workflow

### 1. Caching & Mutation Audit
- Open query hooks (e.g. `useDeals.js`) and find the mutation function (`useUpdateDeal`).
- Ensure `onMutate` cancels queries and snapshots previous data.
- **Mismatch Fix**: Do not use `queryClient.getQueryData(['deals'])` if the active query uses `['deals', userId]`. Use `queryClient.getQueriesData({ queryKey: ['deals'] })` to capture all matching queries, and `queryClient.setQueriesData` to update them optimistically.

### 2. Eliminating Revert Race Conditions
- Check if other mutations run in parallel when a card is dropped (e.g., automated follow-up task logging).
- If a secondary mutation calls `invalidateQueries(['deals'])` on success, it will refetch old data from the server while the primary card update is still in flight, reverting the card temporarily.
- **Cache-Update Fix**: Change the secondary mutation's `onSuccess` from invalidating the whole list to updating only the specific deal’s metadata in the cache directly:
  ```javascript
  queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => 
    old.map(d => d.id === dealId ? { ...d, last_activity: now } : d)
  );
  ```

### 3. Drag-and-Drop Visual Polish
- Map custom `dragOverClass` backgrounds and shadow glows to each Kanban column utilizing the droppable container's `snapshot.isDraggingOver`.
- Set unique cards boundaries (e.g. gold glowing borders for VIP deals or distinct warning states for stagnant cards).
- Use `framer-motion` for spring dragging scales and hover translations. **Never combine Framer Motion transforms with standard CSS `transition: all` classes** on draggable elements to avoid layout thrashing and frozen UIs.

## Common Mistakes
- **Global Invalidation**: Invalidation of list queries in fast mutations causing card jumping before save transactions finish in database.
- **Transition Conflict**: Mixing CSS transition properties on React Beautiful DND elements, causing dragging freeze or jitter.
- **Prefix Key mismatch**: Query data mismatch where getQueryData/setQueryData does not match the active query key prefix parameter structure.
