# Remediation Plan for Verification Failures (Milestone 4 - Loop 1)

Please implement the following fixes in the codebase to resolve the issues reported by Reviewers and Challengers.

## 1. Customers Page Bug: Runtime Crash & Unused Variable
- **File**: `src/pages/CustomersPage.jsx`
- **Fixes**:
  1. Add `Filter` to the imports from `'lucide-react'` at the top of the file (around line 23-28):
     ```javascript
     import { Plus, Search, Mail, Phone, ExternalLink, Calendar, Edit2, Trash2, Filter } from 'lucide-react';
     ```
  2. Remove the unused variable `i` inside the file if present (e.g. line 59) to clean up eslint warnings.

## 2. Tour Engine: Resize Memory Leak & Unused Imports
- **File**: `src/components/onboarding/TourEngine.jsx`
- **Fixes**:
  1. Bind the resize event listener to a named helper function `handleResize` instead of recreating an anonymous arrow function, to ensure proper cleanup:
     ```javascript
     // Change inside useEffect (around lines 270-275):
     const handleResize = () => updateCoordinates();
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
     ```
  2. Remove unused imports `useRef` and `AnimatePresence` from imports to clean up lint errors.

## 3. Metric Tooltip: Translate Offset Alignment Fix
- **File**: `src/components/ui/MetricTooltip.jsx`
- **Fixes**:
  1. To prevent Framer Motion's vertical transform inline styling from overriding Tailwind's horizontal translation style (`-translate-x-1/2`), include `x: "-50%"` directly in Framer Motion's properties:
     ```javascript
     // Change inside motion.div attributes:
     initial={{ opacity: 0, scale: 0.95, x: "-50%", y: position === 'top' ? 4 : -4 }}
     animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
     exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
     ```

## 4. Pipeline Page: Data Integrity & Unused Imports
- **File**: `src/pages/PipelinePage.jsx`
- **Fixes**:
  1. **Stale Customer ID Leak**: In `onChange` of the company name input (around line 730), if the company name typed by the user does not match any existing customer, set `customer_id` to an empty string `""` instead of retaining the old one:
     ```javascript
     onChange={(e) => {
       const company = e.target.value;
       const matched = customers.find(c =>
         (c.company || '').toLowerCase() === company.toLowerCase() ||
         (c.name || '').toLowerCase() === company.toLowerCase()
       );
       setNewDeal({
         ...newDeal,
         company,
         customer_id: matched ? matched.id : "", // Fixed stale ID leak
       });
     }}
     ```
  2. **Blank Company Matching**: In `handleQuickAdd` matching (around line 246), do not match empty company fields. Only run `find` lookup if `quickDeal.company` has non-blank text:
     ```javascript
     const matched = quickDeal.company.trim()
       ? customers.find(c =>
           (c.company || '').toLowerCase() === quickDeal.company.trim().toLowerCase() ||
           (c.name || '').toLowerCase() === quickDeal.company.trim().toLowerCase()
         )
       : null; // Fixed blank company mismatch
     ```
  3. Remove unused imports/variables: `STAGES`, `DialogHeader`, `DialogTitle` if they are defined but unused (lines 16 and 24).

## 5. Customer LTV Refetch Optimization
- **File**: `src/hooks/useCustomers.js`
- **Fixes**:
  1. In the Postgres realtime channel changes listener (around line 102-108), replace the unconditional `invalidateQueries` with direct query cache updates using `queryClient.setQueriesData` matching the structure implemented for deals:
     ```javascript
     const channel = supabase
       .channel('public:customers')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
         const { eventType, new: newRecord, old: oldRecord } = payload;
         queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
           if (!old) return old;
           const isOwned = (record) => !record.owner_id || record.owner_id === user.id;

           if (eventType === 'INSERT' && isOwned(newRecord)) {
             if (old.some(c => c.id === newRecord.id)) return old;
             return [newRecord, ...old];
           }
           if (eventType === 'UPDATE') {
             const existing = old.find(c => c.id === newRecord.id);
             if (existing && JSON.stringify(existing) === JSON.stringify(newRecord)) return old;
             if (!isOwned(newRecord)) return old.filter(c => c.id !== newRecord.id);
             return old.map(c => c.id === newRecord.id ? { ...c, ...newRecord } : c);
           }
           if (eventType === 'DELETE') {
             return old.filter(c => c.id !== oldRecord.id);
           }
           return old;
         });
       })
       .subscribe();
     ```
  2. In `useUpdateCustomer` success handler (around line 135), directly write the data to the query cache:
     ```javascript
     onSuccess: (data, variables) => {
       if (data) {
         queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
           if (!old) return [data];
           return old.map(c => c.id === data.id ? data : c);
         });
       } else {
         queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
           if (!old) return old;
           return old.map(c => c.id === variables.id ? { ...c, ...variables } : c);
         });
       }
       toast.success('อัปเดตลูกค้าสำเร็จ');
     }
     ```

## 6. Drag-to-Scroll Layout Reflow Fix
- **File**: `src/hooks/useHorizontalScroll.js`
- **Fixes**:
  1. Cache `element.offsetLeft` in local variables `offsetLeftVal` and `touchOffsetLeftVal` inside `mousedown` and `touchstart` event handlers, rather than reading the property continuously on every mouse/touch movement:
     ```javascript
     let offsetLeftVal = 0;
     const handleMouseDown = (e) => {
       if (e.target.closest('[data-draggable]')) return;
       isDown = true;
       offsetLeftVal = element.offsetLeft; // Cached once here
       startX = e.pageX - offsetLeftVal;
       scrollLeft = element.scrollLeft;
       element.style.cursor = 'grabbing';
       element.style.scrollBehavior = 'auto';
     };
     
     const handleMouseMove = (e) => {
       if (!isDown) return;
       e.preventDefault();
       const x = e.pageX - offsetLeftVal; // Used cached value
       const walk = (x - startX) * 2;
       element.scrollLeft = scrollLeft - walk;
     };

     let touchOffsetLeftVal = 0;
     const handleTouchStart = (e) => {
       touchOffsetLeftVal = element.offsetLeft; // Cached once here
       touchStartX = e.touches[0].pageX - touchOffsetLeftVal;
       touchScrollLeft = element.scrollLeft;
     };

     const handleTouchMove = (e) => {
       const x = e.touches[0].pageX - touchOffsetLeftVal; // Used cached value
       const walk = (x - touchStartX) * 1.5;
       element.style.scrollBehavior = 'auto';
       element.scrollLeft = touchScrollLeft - walk;
     };
     ```

## 7. Transition Paint Overhead Fix
- **File**: `src/components/pipeline/PipelineBoard.jsx`
- **Fixes**:
  1. In the column element container (around line 547), replace `transition-all` with selective CSS transitions:
     ```javascript
     // Change transition-all to selective transitions:
     className={cn(
       'flex-shrink-0 flex flex-col w-[290px] h-full rounded-2xl transition-[background-color,border-color,box-shadow,transform] duration-300 border overflow-hidden',
       snapshot.isDraggingOver
         ? `ring-2 shadow-lg ${stage.dragOverClass}`
         : 'bg-white/70 backdrop-blur-sm border-slate-200/80 shadow-sm hover:shadow-md'
     )}
     ```

## 8. App Layout & Tools Page Unused Variables
- **Files**: `src/components/layout/AppLayout.jsx`, `src/pages/ToolsPage.jsx`
- **Fixes**:
  1. Remove `shouldBlockBasic` and `routeMotionProps` variables if assigned but unused in `AppLayout.jsx`.
  2. Remove `user` variable if defined but unused in `ToolsPage.jsx`.
