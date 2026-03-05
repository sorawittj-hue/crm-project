---
title: Zenith Ultimate Orchestrator (ZUO) Planning
status: draft
---

# Feature: Zenith Ultimate Orchestrator (ZUO) - The World-Class Business Command Center

## Task Breakdown
### Phase 1: Zenith Design System (The "Look & Feel")
- **Task 1.1:** Define and implement the "Zenith Theme" CSS architecture (`:root` variables for Obsidian, Gold, and Neon).
- **Task 1.2:** Create the `GlassCard` wrapper with `backdrop-filter` and "Golden Glow" border effects.
- **Task 1.3:** Develop the "Zenith-Scale" Typography set (using premium-grade font stacks like Inter/Outfit).
- **Task 1.4:** Build premium button variants with 3D-depth and hover light-reflection effects.

### Phase 2: Actionable Notification Orbs (The "Flow")
- **Task 2.1:** Create the `ActionPortal` - a global container for floating notification orbs.
- **Task 2.2:** Build the `Orb` component with "Liquid-Motion" SVG animations.
- **Task 2.3:** Implement the logic to "Capture" deal events and spawn orbs (e.g., "High value deal stagnant for 48h").
- **Task 2.4:** Wire the orbs to perform quick actions (Notes, Status Change) without full-page navigation.

### Phase 3: Strategic Mandate AI (The "Intelligence")
- **Task 3.1:** Create the `ZenithPromptEngine` - a specialized utility to prepare pipeline data for deep strategic analysis by Gemini.
- **Task 3.2:** Develop the `StrategicMandateCard` UI to display AI business advice with high-impact "Command" buttons.
- **Task 3.3:** Implement "Focus Mode" - a filtration logic that visually dims low-priority deals and "Pops" high-value ones.
- **Task 3.4:** Build the "Win Probability" gauge using AI-driven scoring (Sentiment + Velocity).

### Phase 4: Motion & Micro-interactions (The "Luxury")
- **Task 4.1:** Integrate `framer-motion` for "Liquid Layout" transitions between dashboard tabs.
- **Task 4.2:** Implement "Particle Effects" or "Confetti" for "Won" deals using high-performance Canvas or SVG.
- **Task 4.3:** Add "Haptic Visuals" (subtle shifts in button shadows and light reflections on click).
- **Task 4.4:** Final performance profiling to ensure glass effects maintain 60FPS.

## Dependencies
- `framer-motion` for advanced animations.
- Google Gemini API (already integrated).
- Lucid-React for iconography (extended with custom SVG icons if needed).

## Effort Estimates
- Phase 1 (Look & Feel): 4-5 hours
- Phase 2 (Flow/Orbs): 3 hours
- Phase 3 (Intelligence): 4 hours
- Phase 4 (Motion/Luxury): 3 hours

## Implementation Order
1. **Phase 1 (Look & Feel)**: Establish the visual foundation first.
2. **Phase 3 (Intelligence)**: Build the logic that feeds the command center.
3. **Phase 2 (Flow/Orbs)**: Implement the reactive interaction system.
4. **Phase 4 (Motion/Luxury)**: Final polish and "Wow" factor.

## Risks and Mitigation
- **Risk:** High visual density (blur/glow) slows down the app.
  - **Mitigation:** Use `will-change` CSS property and prioritize hardware-accelerated transforms.
- **Risk:** AI "Mandates" are too generic.
  - **Mitigation:** Refine the prompt to include specific deal names, values, and historical context.
- **Risk:** "Notification Orbs" become annoying/cluttered.
  - **Mitigation:** Group orbs by type and provide a "Dismiss All" gesture.
