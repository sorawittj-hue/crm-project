# Handoff Report — Onboarding & Performance Fixes Review

## 1. Observation
We examined the onboarding and performance fix implementation across the following files:
1. `src/pages/CustomersPage.jsx`
   - Verified that the `Filter` icon from `lucide-react` is imported on line 27 and used on line 630:
     ```javascript
     {searchTerm ? <Filter size={18} /> : <Plus size={18} />}
     ```
2. `src/components/onboarding/TourEngine.jsx`
   - Verified that the resize listener is bound and cleaned up on lines 83-87:
     ```javascript
     const handleResize = () => updateCoordinates(0);
     window.addEventListener('resize', handleResize);
     return () => {
       window.removeEventListener('resize', handleResize);
     };
     ```
   - Checked for unused imports; all imported modules are used.
3. `src/components/ui/MetricTooltip.jsx`
   - Checked lines 28-30:
     ```javascript
     initial={{ opacity: 0, scale: 0.95, x: "-50%", y: position === 'top' ? 4 : -4 }}
     animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
     exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
     ```
     Horizontal translation offset `x: "-50%"` has been added.
4. `src/pages/PipelinePage.jsx`
   - Checked lines 732-735 (company auto-match logic):
     ```javascript
     const matched = customers.find(c =>
       (c.company || '').toLowerCase() === company.toLowerCase() ||
       (c.name || '').toLowerCase() === company.toLowerCase()
     );
     ```
   - Checked lines 132-143 (modal close/open logic):
     ```javascript
     useEffect(() => {
       if (!isAddModalOpen) {
         setCustomerSearch('');
         setIsCustomerDropdownOpen(false);
         setFormTab('details');
       } else if (newDeal.customer_id) {
         const c = customers.find(x => x.id === newDeal.customer_id);
         if (c) {
           setCustomerSearch(c.name + (c.company ? ` (${c.company})` : ''));
         }
       }
     }, [isAddModalOpen, newDeal.customer_id, customers]);
     ```
5. `src/hooks/useCustomers.js`
   - Checked lines 113-116 and 204-207 (success handlers for `useCreateCustomer` and `useDeleteCustomer`):
     ```javascript
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['customers'] });
       toast.success('เพิ่มลูกค้าสำเร็จ');
     },
     ```
     and
     ```javascript
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['customers'] });
       toast.success('ลบลูกค้าสำเร็จ');
     },
     ```
6. `src/hooks/useHorizontalScroll.js`
   - Checked that `offsetLeft` is cached in `handleMouseDown` (line 28) and `handleTouchStart` (line 69), preventing forced reflows during movements.
7. `src/components/pipeline/PipelineBoard.jsx`
   - Checked transition styles on line 555:
     ```javascript
     className={cn(
       'flex-shrink-0 flex flex-col w-[290px] h-full rounded-2xl transition-[background-color,border-color,box-shadow,transform] duration-300 border overflow-hidden',
     ```
8. `src/components/layout/AppLayout.jsx` & `src/pages/ToolsPage.jsx`
   - Verified that no unused variables or imports exist and the project builds successfully via `npm run build`.

---

## 2. Logic Chain
Based on our observations, we identified several bugs and completeness gaps in the implementation:

1. **Incorrect Blank Company Matching**:
   - In `PipelinePage.jsx` lines 732-735, when `company` is a blank string (e.g., cleared by the user), `company.toLowerCase()` is `""`.
   - The lookup compares this against `(c.company || '').toLowerCase()`. For any customer in the list where `company` is falsy, this evaluates to `true`.
   - The first customer matching this condition is returned as `matched`, assigning `newDeal.customer_id` to that customer instead of leaving it blank.
   - Therefore, blank inputs incorrectly auto-associate the deal with a customer.

2. **Stale Customer ID Leak**:
   - The `newDeal` state is only reset in `handleAddSubmit` when the form is submitted.
   - If a user cancels/closes the modal, the `newDeal` state (including the selected `customer_id` and contact details) is not reset.
   - When the user opens the modal again, the old `customer_id` is still present in state.

3. **Incomplete Direct Query Cache Updates**:
   - In `useCustomers.js`, only `useUpdateCustomer` updates the query cache in-place via `setQueriesData` in its success handler.
   - Both `useCreateCustomer` and `useDeleteCustomer` still call `invalidateQueries`, causing unnecessary refetches.

4. **Uncancelled Timeout in TourEngine**:
   - In `TourEngine.jsx` lines 61-81, the recursive `setTimeout` inside `updateCoordinates` to poll for dynamic mounts is never cleared.
   - If the step changes or the tour ends before the timeout fires, it will still execute, causing state updates on potentially unmounted components or stale coordinates.

---

## 3. Caveats
- We assumed the project uses TanStack Query v5 conventions.
- The build succeeded, confirming that no syntax errors or ESLint compile blockers are present.
- We did not manually modify code since we are a review-only agent.

---

## 4. Conclusion
**Verdict**: REQUEST_CHANGES (FAIL)

### Findings Summary:
1. **[Critical] Blank Company Matching Bug** in `src/pages/PipelinePage.jsx`: Clearing/leaving the company name empty links the new deal to the first customer in the database with a blank company name.
2. **[Major] Stale Customer ID Leak** in `src/pages/PipelinePage.jsx`: Closing the "Add Deal" modal without submitting leaves the selected customer state dirty for the next session.
3. **[Major] Incomplete Cache Updates** in `src/hooks/useCustomers.js`: Success handlers for creation and deletion still trigger network refetches.
4. **[Minor] Uncancelled Timeout** in `src/components/onboarding/TourEngine.jsx`: Retrying spotlight coordinate updates with `setTimeout` can leak callbacks and trigger stale coordinate calculations.

---

## 5. Verification Method
1. Run `npm run build` to verify the build remains clean.
2. Manually test or inspect the files listed above.
3. Once the fixes are implemented, verify that:
   - Clearing the company input clears the `customer_id`.
   - Closing the add deal modal resets `newDeal` state.
   - `useCreateCustomer` and `useDeleteCustomer` update the cache directly.
   - The `setTimeout` recursion in `TourEngine.jsx` is cleared on unmount/step change.
