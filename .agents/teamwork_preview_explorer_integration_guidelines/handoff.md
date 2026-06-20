# Handoff Report: System Audit and Integration Guidelines

## 1. Observation
1. **Dependencies (`package.json`)**:
   - `react` and `react-dom` version: `"^18.2.0"` (Lines 33-34).
   - `@hello-pangea/dnd` version: `"^18.0.1"` (Line 18) - React 18 compatible drag-and-drop library.
   - `@tanstack/react-query` version: `"^5.90.21"` (Line 26) - used for server state caching.
   - `framer-motion` version: `"^12.38.0"` (Line 29) - used for animations.
   - `pdfjs-dist` version: `"^5.7.284"` (Line 32) - heavy PDF parser.
   - Vite version: `"^8.0.10"` (Line 54).

2. **Vite Build Configuration (`vite.config.js`)**:
   - Path normalization: `const normalizedId = id.replaceAll('\\', '/');` (Line 28) - normalizes Windows-style backslashes to forward slashes.
   - Rollup code splitting: segments modules into vendor chunks (`vendor-react`, `vendor-query`, `vendor-supabase`, `vendor-ui`, `vendor-charts`, `vendor-motion`, `vendor-utils`) via `manualChunks: getManualChunk` (Line 49).

3. **Styling Conventions (`src/index.css` & `tailwind.config.js`)**:
   - Tailwind config extends color palette with a custom "Kawaii theme" (pink, mint, lavender, peach, sky, cream) and cute keyframe animations (`bounce-in`, `wiggle`, `float`, `pulse-cute`, `heartbeat`, `shimmer`, `slide-up`) (Lines 130-194).
   - `src/index.css` defines base design tokens as HSL values under `:root` (Lines 6-46) and custom utility classes like `.glass`, `.glass-card`, `.premium-card`, and `.btn-zenith-primary` (Lines 81-170).

4. **Vite server configuration**:
   - Uses port `7777` with `strictPort: false` to automatically assign another port if `7777` is in use (Lines 41-44).

5. **Component Re-renders (`src/components/pipeline/PipelineBoard.jsx`)**:
   - `InnerList` and `DealCard` are wrapped in `memo()` (Lines 678, 708).
   - However, in `PipelineBoard.jsx` the handler callbacks: `handleMoveDeal` (Line 253), `togglePin` (Line 313), and `setSelectedDealId` are passed directly without `useCallback()` wrapping.
   - In `PipelinePage.jsx`, `handleUpdateDeal` (Line 39) is also passed down without `useCallback()`, which constantly invalidates child memoization.

6. **API Operations & Realtime Synchronization (`src/hooks/useDeals.js` & `src/services/apiDeals.js`)**:
   - The Supabase Realtime channel invalidates queries on any postgres change:
     ```javascript
     const channel = supabase
       .channel('public:deals')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
         queryClient.invalidateQueries({ queryKey: ['deals'] });
       })
       .subscribe();
     ``` (Lines 19-24).
   - In `useUpdateDeal()`, the mutation success also triggers an invalidation:
     ```javascript
     onSuccess: (data, variables, context) => {
       queryClient.invalidateQueries({ queryKey: ['deals'] });
       ...
     ``` (Line 79).
   - `updateDeal()` in `apiDeals.js` returns the updated row from Supabase:
     ```javascript
     const { data, error } = await supabase
       .from('deals')
       .update(payload)
       .eq('id', id)
       .select();
     if (!error) return data?.[0];
     ``` (Lines 125-131).

---

## 2. Logic Chain
1. **Windows Pathing & Build Safety**:
   - Rollup's chunk identifier (`id`) on Windows uses backslashes (e.g., `node_modules\react\index.js`), whereas POSIX environments use forward slashes.
   - By normalizing `id` using `id.replaceAll('\\', '/')` in `vite.config.js` (Obs 2.a), the chunking logic consistently places files into their respective vendor chunks, avoiding Windows build regressions (e.g. huge unified bundles).
   - Standard Vite port allocation (`strictPort: false`) prevents the build pipeline dev server from failing if another process is holding port `7777` (Obs 4.a).

2. **DND Render Lag (Memoization Breakdown)**:
   - React's `memo()` only prevents re-renders if props are shallowly equal.
   - Functions defined directly inside components change their reference identity on every render of the parent.
   - Because `handleMoveDeal`, `togglePin`, and `handleUpdateDeal` are not wrapped in `useCallback` (Obs 5.b, 5.c), they receive fresh identities on every render of `PipelineBoard` or `PipelinePage`.
   - As a result, the `memo()` on `InnerList` and `DealCard` is bypassed, leading to complete board and card re-renders on minor interactions (like opening filters or typing in searches), causing visual lag.

3. **Double network refetching**:
   - Moving a card in `@hello-pangea/dnd` fires a mutation (`useUpdateDeal`).
   - On mutation completion, `onSuccess` invalidates `['deals']` (Obs 6.b), causing a full network refetch.
   - Almost concurrently, the Supabase postgres realtime channel hears the change and triggers another `queryClient.invalidateQueries({ queryKey: ['deals'] })` (Obs 6.a), causing a second redundant network query.
   - During heavy dragging or high-frequency drops, this results in network congestion and UI stuttering, especially on Windows browsers where high display scaling (125-150% DPI) already increases layout recalculation overheads.

---

## 3. Caveats
- **Local DB Fallback**: Under guest mode, `useDeals` queries local DB (IndexedDB/localStorage via `localforage`) instead of Supabase. Direct cache updates must be compatible with both Supabase payloads and local DB returns.
- **Offline Mode**: Since this is a read-only investigation, the network requests are audited based on existing code structure; offline resilience was not tested end-to-end.

---

## 4. Conclusion
The current workspace is fully Windows-compatible and compiles cleanly. However, DND performance degrades due to **broken React component memoization** and **redundant double query invalidations (Vite/Supabase Realtime + Mutation Success)**. Furthermore, the global layout in `AppLayout.jsx` is well-positioned to support onboarding integration.

---

## 5. Integration Guidelines

### Onboarding UX Integration Guideline
1. **State Management**:
   - Extend `src/store/useAppStore.js` with an onboarding state segment:
     ```javascript
     onboardingStep: 0,
     isOnboardingActive: false,
     startOnboarding: () => set({ isOnboardingActive: true, onboardingStep: 1 }),
     nextOnboardingStep: () => set((state) => ({ onboardingStep: state.onboardingStep + 1 })),
     endOnboarding: () => set({ isOnboardingActive: false, onboardingStep: 0 }),
     ```
2. **Onboarding Elements Mapping**:
   - Tag interactive components across target pages with a custom HTML attribute (e.g., `data-tour`).
     - In `AppLayout.jsx` sidebar: `<NavLink data-tour="nav-pipeline" ...>`
     - In `CommandCenterPage.jsx`: `<div data-tour="kpi-target" ...>`
     - In `PipelineBoard.jsx`: `<div data-tour="kanban-board" ...>`
3. **Onboarding Overlay Component**:
   - Create a reusable `OnboardingTour` overlay inside `src/components/layout/AppLayout.jsx`.
   - Use `framer-motion` for a premium glassmorphic overlay, positioning high-contrast cards or tooltips relative to targeted elements using `getBoundingClientRect()` of elements selected via `document.querySelector('[data-tour="..."]')`.

---

### DND Performance Fixes Integration Guideline

#### Step 1: Optimize Real-time Subscription to Avoid Full-Table Refetches
In `src/hooks/useDeals.js`, update the realtime subscription handler to update the query cache incrementally rather than calling `invalidateQueries`:
```javascript
// Target: src/hooks/useDeals.js
// Replace lines 19-24 (invalidateQueries) with direct cache manipulation:
const channel = supabase
  .channel('public:deals')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
    if (payload.eventType === 'UPDATE' && payload.new) {
      // Filter out events that do not belong to current user
      if (payload.new.owner_id && payload.new.owner_id !== user.id) return;
      
      queryClient.setQueriesData({ queryKey: ['deals', user.id, isGuestAccount] }, (old) => {
        if (!old) return old;
        return old.map(deal => deal.id === payload.new.id ? { ...deal, ...payload.new } : deal);
      });
    } else if (payload.eventType === 'INSERT' && payload.new) {
      if (payload.new.owner_id && payload.new.owner_id !== user.id) return;
      
      queryClient.setQueriesData({ queryKey: ['deals', user.id, isGuestAccount] }, (old) => {
        if (!old) return [payload.new];
        if (old.some(d => d.id === payload.new.id)) return old;
        return [payload.new, ...old];
      });
    } else if (payload.eventType === 'DELETE' && payload.old) {
      queryClient.setQueriesData({ queryKey: ['deals', user.id, isGuestAccount] }, (old) => {
        if (!old) return old;
        return old.filter(deal => deal.id !== payload.old.id);
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  })
  .subscribe();
```

#### Step 2: Prevent Redundant Invalidation in useUpdateDeal Mutation
Update `useUpdateDeal` in `src/hooks/useDeals.js` to update the cache directly using the returned server payload in `onSuccess`, preventing the API fetch cycle:
```javascript
// Target: src/hooks/useDeals.js
// Update the onSuccess callback in useUpdateDeal:
onSuccess: (data, variables, context) => {
  if (data) {
    queryClient.setQueriesData({ queryKey: ['deals', user?.id, isGuestAccount] }, (old) => {
      if (!old) return [data];
      return old.map(deal => deal.id === data.id ? data : deal);
    });
  } else {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
  }
  
  if (variables.stage === 'won') {
    // ... keep existing integration notification dispatch logic
  }
}
```

#### Step 3: Memoize Callback Functions with useCallback
Wrap the callback functions in `PipelineBoard.jsx` and `PipelinePage.jsx` inside `useCallback` to ensure component memoization:
```javascript
// Target: src/components/pipeline/PipelineBoard.jsx
// Memoize drag/move/pin/select callback handlers
const handleDragEnd = useCallback((result) => {
  // Existing handleDragEnd code...
}, [shouldBlockBasic, openPaywall, isGuestAccount, dealsByStage, STAGES]);

const handleMoveDeal = useCallback((dealId, direction) => {
  // Existing handleMoveDeal code...
}, [localDeals, STAGES]);

const togglePin = useCallback((dealId) => {
  setPinnedDealIds((prev) =>
    prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
  );
}, []);
```

---

## 6. Verification Method
- **Verify Build**: Run `npm run build` in the project root to verify bundle generation.
- **Verify Realtime Handler**: Open the application, open devtools network tab, trigger a deal update (e.g., drag and drop). Confirm that:
  1. Only the `PATCH` request to Supabase goes out.
  2. No subsequent `GET` requests targeting `deals?select=*` are triggered (meaning cache updates are applied inline).
