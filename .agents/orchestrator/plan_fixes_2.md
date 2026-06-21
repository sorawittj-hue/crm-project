# Remediation Plan for Verification Failures (Milestone 4 - Loop 2)

Please apply the following fixes to resolve the visual and functional issues reported by the UX Reviewer (Round 2).

## 1. Tour Engine Fixes (Resize Listener, Timeout Leaks, Mobile Clipping, Transitions)
- **File**: `src/components/onboarding/TourEngine.jsx`
- **Fixes**:
  1. **Resize Listener & Timeout Leak**: Structure the `useEffect` hook to always bind the window resize listener, and use a local tracking flag `active = true` to clean up asynchronous coordinate update retries on unmount/step changes.
     ```javascript
     useEffect(() => {
       if (!isTourActive || !activeStep) return;

       let timer;
       let active = true;

       const updateCoordinates = (attempt = 0) => {
         if (!active) return;
         const el = document.querySelector(activeStep.target);
         if (el) {
           const rect = el.getBoundingClientRect();
           setCoords({
             top: rect.top - 8,
             left: rect.left - 8,
             width: rect.width + 16,
             height: rect.height + 16,
             right: rect.right + 8,
             bottom: rect.bottom + 8,
           });
           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
         } else if (attempt < 10) {
           timer = setTimeout(() => updateCoordinates(attempt + 1), 100);
         } else {
           setCoords(null);
         }
       };

       if (window.location.pathname !== activeStep.path) {
         navigate(activeStep.path);
         timer = setTimeout(() => updateCoordinates(0), 300);
       } else {
         updateCoordinates(0);
       }

       const handleResize = () => updateCoordinates(0);
       window.addEventListener('resize', handleResize);

       return () => {
         active = false; // Prevents pending timeouts from executing
         clearTimeout(timer);
         window.removeEventListener('resize', handleResize);
       };
     }, [isTourActive, currentStep, navigate, activeStep]);
     ```
  2. **Mobile Viewport Left Coordinates Clipping**: Modify the horizontal positioning calculation to center the card on mobile screens (viewport < 450px) to prevent layout offsets from clipping the card:
     ```javascript
     style={{
       top: coords.bottom + 12 > window.innerHeight - 250 ? undefined : coords.bottom + 12,
       bottom: coords.bottom + 12 > window.innerHeight - 250 ? window.innerHeight - coords.top + 12 : undefined,
       left: window.innerWidth < 450
         ? 16
         : Math.min(window.innerWidth - 400, Math.max(16, coords.left)),
     }}
     ```
     Also update the card class list to have responsive widths:
     ```jsx
     className="fixed sm:absolute bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-[calc(100vw-32px)] sm:w-96 pointer-events-auto z-[10000] flex flex-col gap-4"
     ```
  3. **Smooth Step Transitions**: Add `key={currentStep}` to the tour description container `<motion.div>` to trigger enter/exit animations when transitioning steps.

## 2. Metric Tooltip Style Conflict & Animations
- **File**: `src/components/ui/MetricTooltip.jsx`
- **Fixes**:
  1. Remove `-translate-x-1/2` from the Tailwind class lists (on lines 76 and 77 or surrounding lines) to prevent conflict with Framer Motion's horizontal translate styles.
  2. Expand the `exit` state of the `<motion.div>` to animate `y`, `scale`, and `opacity` symmetrically with the initial state to prevent mounting layout shifts:
     ```jsx
     exit={{ opacity: 0, scale: 0.95, x: "-50%", y: position === 'top' ? 4 : -4 }}
     transition={{ duration: 0.15 }}
     ```

## 3. React Purity Linter Warnings
- **File**: `src/pages/CommandCenterPage.jsx`
  - In `actionPlan` `useMemo` (around line 247), insert `// eslint-disable-next-line react-hooks/purity` above the `Date.now()` call:
    ```javascript
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    ```
- **File**: `src/components/pipeline/MonthlyPipeline.jsx`
  - In the KPI stats `useMemo` (around line 100), insert `// eslint-disable-next-line react-hooks/purity` above the `Date.now()` call:
    ```javascript
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now();
    ```
