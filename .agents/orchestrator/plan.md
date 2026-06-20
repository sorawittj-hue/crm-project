# Project Execution Plan - CRM Onboarding & Pipeline Performance

This plan outlines the milestones and steps required to implement the UX Onboarding experience and fix the drag-and-drop performance issue in the CRM.

## Milestones

### Milestone 1: Exploration & Technical Research
- **Objective**: Identify the causes of drag-and-drop lag on the Pipeline page and investigate the best design/approach for the beginner onboarding experience.
- **Tasks**:
  1. Spawn Explorers to analyze `src/pages/PipelinePage.jsx`, `src/components/pipeline/PipelineBoard.jsx`, and database real-time sync listeners.
  2. Spawn Explorers to explore the CRM UI structure (`src/components/layout/AppLayout.jsx`, `src/pages/CommandCenterPage.jsx`, etc.) and recommend an onboarding UX solution.
  3. Produce a consolidated exploration report outlining the DND optimization strategy and the UX onboarding flow.
- **Verification**: Exploration report generated and verified by the orchestrator.

### Milestone 2: R1 - Onboarding Experience & UX Simplifications
- **Objective**: Implement a guided onboarding system to orient new users within the CRM.
- **Tasks**:
  1. Spawn a Worker to create an interactive tour/guided onboarding component (using a custom floating tooltip/tour component or a lightweight library if available, ensuring zero impact on other page components).
  2. Add onboarding steps for key pages: Command Center, Customers, Pipeline, and Analytics.
  3. Ensure a first-time user sees the onboarding tour automatically, with options to skip, replay, and proceed step-by-step.
  4. Design clear visual indicators/tooltips explaining complex dashboard metrics.
- **Verification**: Reviewers confirm the onboarding tour functions correctly, supports keyboard/mouse navigation, and clearly explains metrics.

### Milestone 3: R2 - Drag & Drop Performance Optimization
- **Objective**: Permanently fix the severe lag/freezing issue on the Pipeline page during drag-and-drop.
- **Tasks**:
  1. Optimize state updates: decouple active drag state from the global page/deals state to avoid cascading re-renders during dragging.
  2. Suspend or throttle real-time queries and network refetching *during* drag operations.
  3. Implement performance-minded list rendering (e.g. `React.memo` on Pipeline Cards, optimized drag events).
  4. Ensure smooth 60fps interaction during drags.
- **Verification**: Challengers execute drag stress tests (large number of deals) to verify zero frame-dropping, and confirm database update occurs post-drag without interrupting interaction.

### Milestone 4: Integration Verification & Audit
- **Objective**: Verify the entire system is stable, performs optimally, and complies with integrity constraints.
- **Tasks**:
  1. Run complete build and test suite.
  2. Run Forensic Audit to verify implementation authenticity and performance metrics.
  3. Gather feedback and finalize the handoff report.
- **Verification**: Forensic Auditor reports CLEAN.
