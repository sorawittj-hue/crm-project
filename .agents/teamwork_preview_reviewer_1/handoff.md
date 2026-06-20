# Handoff Report — Review of Onboarding and Pipeline Changes

This report evaluates the code changes in:
- `src/hooks/useDeals.js`
- `src/components/pipeline/PipelineBoard.jsx`
- `src/pages/PipelinePage.jsx`
- `src/store/useOnboardingStore.js`
- `src/components/ui/MetricTooltip.jsx`
- `src/components/onboarding/TourEngine.jsx`
- `src/components/onboarding/OnboardingWidget.jsx`
- `src/components/layout/AppLayout.jsx`

---

## 1. Observation
- **Compile Status**: Successful production build completed in **1.52s** via `npm run build` with no fatal compile-time errors.
- **Lint Status**: `npm run lint` failed with **98 problems (94 errors, 4 warnings)** across the codebase. Within the files under review, the following lint errors were observed:
  - **`src/pages/PipelinePage.jsx`**:
    - Line 16: `STAGES` is defined but never used (`no-unused-vars`).
    - Line 24: `DialogHeader` and `DialogTitle` are defined but never used (`no-unused-vars`).
  - **`src/components/onboarding/TourEngine.jsx`**:
    - Line 1: `useRef` is defined but never used (`no-unused-vars`).
    - Line 3: `AnimatePresence` is defined but never used (`no-unused-vars`).
  - **`src/components/layout/AppLayout.jsx`**:
    - Line 239: `shouldBlockBasic` is assigned a value but never used (`no-unused-vars`).
    - Line 332: `routeMotionProps` is assigned a value but never used (`no-unused-vars`).
- **Purity Warnings / Errors**:
  - In `src/components/pipeline/PipelineBoard.jsx` (lines 140-146), an eslint-disable comment `// eslint-disable-next-line react-hooks/purity` was used to bypass the React Compiler's warning on calling the impure function `Date.now()` and modifying a ref (`nowMsRef.current = Date.now()`) inside a `useMemo`.
  - In other unreviewed files (e.g. `MonthlyPipeline.jsx` line 100 and `CommandCenterPage.jsx` line 247), this same pattern resulted in hard linter errors: `Error: Cannot call impure function during render`.
- **Data Integrity Logic**:
  - In `src/pages/PipelinePage.jsx` line 738:
    `customer_id: matched ? matched.id : newDeal.customer_id`
  - In `src/pages/PipelinePage.jsx` lines 246-249:
    `const matched = customers.find(c => (c.company || '').toLowerCase() === quickDeal.company.toLowerCase() || ...)`

---

## 2. Logic Chain

### Issue A: Stale Customer ID Leak (Data Integrity Bug)
1. **Observation**: `customer_id: matched ? matched.id : newDeal.customer_id` is executed during company input changes.
2. **Logic**:
   - If a user types a company name that matches a customer (e.g. "Acme Corp"), `matched` becomes the customer object and `customer_id` is set to "Acme Corp's ID".
   - If the user changes their mind and types a different company name (e.g. "Unknown Corp") which does not match any existing customer, `matched` becomes `undefined`.
   - The expression evaluates to `newDeal.customer_id` (the previous value).
   - Thus, the new deal is silently linked to "Acme Corp" even though the user has typed "Unknown Corp", leading to wrong linkages and data leaks.

### Issue B: Blank Company False Match (Linkage Bug)
1. **Observation**: `quickDeal.company` defaults to `""` in the Quick Add form. The matching logic performs `(c.company || '').toLowerCase() === quickDeal.company.toLowerCase()`.
2. **Logic**:
   - If a user creates a quick deal and leaves the company name blank (only entering a title), `quickDeal.company` remains `""`.
   - The lookup compares `(c.company || '').toLowerCase() === ""`.
   - If any customer in the system has a `null`, `undefined`, or `""` company field, `(c.company || '')` becomes `""`, yielding a match (`"" === ""` is true).
   - The new deal gets linked to that customer's ID automatically.

### Issue C: Volatile In-Column Reordering
1. **Observation**: Dragging within the same column only updates `localDeals` component state, with no API call or state persistence.
2. **Logic**:
   - When the `deals` prop changes (due to a refetch, real-time sync, or page action), the reference changes.
   - The component's render check `if (deals !== prevDeals)` evaluates to true.
   - `localDeals` is reset to the prop `deals`, erasing the manual drag order.

---

## 3. Caveats
- Real-time features (via Supabase) and optimistic rendering were reviewed purely at the code level, as live Supabase endpoints were not connected during local verification.
- The build succeeds because bundler configurations are lenient with unused variables/imports, but CI pipelines with strict lint checks will fail.

---

## 4. Conclusion & Verdict

**Verdict**: **REQUEST_CHANGES**

### Critical/Major Findings:
1. **Data Integrity Leak on Company Clear**: `customer_id: matched ? matched.id : newDeal.customer_id` retains stale customer associations when typing unmatched company names.
2. **Blank Company Match in Quick Add**: Quick deals without a company name get linked to arbitrary customers who have empty company fields.

### Minor Findings:
1. **ESLint Violations**: Unused imports/variables in `PipelinePage.jsx`, `TourEngine.jsx`, and `AppLayout.jsx` fail lint checks.
2. **Impure Render Callback**: Updating `nowMsRef.current = Date.now()` within `useMemo` in `PipelineBoard.jsx` violates React purity rules and is bypassed via eslint-disable annotations.
3. **Volatile Reordering**: Reordering cards in the same column is fragile and gets lost on any React Query cache refetch.

---

## 5. Verification Method
- **Production Build**: Run `npm run build` to verify the bundle compiles.
- **Linter Check**: Run `npm run lint` to inspect current unused imports and variable warnings.
