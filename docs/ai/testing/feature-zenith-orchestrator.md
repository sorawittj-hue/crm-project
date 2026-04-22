---
title: Zenith Ultimate Orchestrator (ZUO) Testing
status: draft
---

# Feature: Zenith Ultimate Orchestrator (ZUO) - The World-Class Business Command Center

## Unit Test Cases / Manual Verifications
- **Visual Rendering:** Verify `backdrop-filter` rendering across Chrome, Firefox, and Edge.
- **Theme Switching:** Ensure the "Zenith Theme" CSS classes are applied correctly and do not clash with standard styles.
- **Mandate Accuracy:** Test various pipeline data snapshots to ensure AI provides specific, logical, and energetic business mandates in Thai.
- **Focus Mode Filtering:** Verify that enabling "Focus Mode" correctly filters deals based on the `High-Value` threshold (> 500k THB) and dims low-priority items.
- **Velocity Index Calculation:** Verify that `velocityIndex` increases when a deal moves stages rapidly and decreases when it sits idle.
- **Orb Positioning:** Verify "Actionable Orbs" do not overlap crucial UI elements (e.g., Save buttons, Filter menus).

## Integration Test Scenarios
- **Strategic Command Loop:**
  1. Update a deal to a "Stagnant" state. 
  2. Verify an AI Strategic Mandate is automatically generated or prompted. 
  3. Verify an "Actionable Orb" appears for the salesperson to follow up.
  4. Complete the task via the Orb UI and verify the dashboard reflects the update.
- **Win Probability Logic:**
  1. Add a positive note to a deal.
  2. Verify the AI Sentiment analyzer detects the tone.
  3. Verify the "Win Probability" gauge increases by at least 5-10%.

## UX Testing Steps
1. Toggle to "Zenith Mode". Verify the transition is "smooth and silky".
2. Check the "Performance Gauge" vs. database values for accuracy.
3. Open "Focus Mode" and verify only high-priority cards remain fully visible.
4. Hover over buttons. Ensure the "Glow" and "Reflection" effects feel premium and responsive.
5. Record a 60FPS interaction video to verify frame stability with glass effects.

## Verify Success Criteria (New Feature World-Class Standards)
- [ ] Adaptive UI (Zenith Mode) feels like a $100k/year enterprise tool.
- [ ] AI Strategic Mandates are actionable and not generic corporate-speak.
- [ ] Actionable Orbs reduce navigation clicks by > 50% for note/task creation.
- [ ] Every user interaction (hover/click) has meaningful visual feedback.
